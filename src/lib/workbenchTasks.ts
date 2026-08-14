import {
  RoleAccount,
  WorkbenchScheduleItem,
  WorkbenchTaskReference,
  WorkbenchTaskSnapshot,
  WorkbenchTaskState,
  WorkbenchTaskStatus,
} from '../types';

const STORAGE_PREFIX = 'crm-h5.workbench-tasks.v1';
const SCHEMA_VERSION = 1 as const;

export const getWorkbenchDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getWorkbenchTaskKey = ({ kind, id }: WorkbenchTaskReference) => `${kind}:${id}`;

const initialStatusForSchedule = (item: WorkbenchScheduleItem): WorkbenchTaskStatus => (
  item.status === '已完成' ? 'completed' : 'pending'
);

export const createInitialWorkbenchTaskSnapshot = (
  account: RoleAccount,
  dateKey = getWorkbenchDateKey(),
): WorkbenchTaskSnapshot => {
  const tasks: Record<string, WorkbenchTaskState> = {};

  account.workbenchPriorities.forEach((priority) => {
    tasks[getWorkbenchTaskKey({ kind: 'priority', id: priority.id })] = {
      status: 'pending',
      focused: true,
    };
  });

  account.workbenchSchedule.forEach((item) => {
    tasks[getWorkbenchTaskKey({ kind: 'schedule', id: item.id })] = {
      status: initialStatusForSchedule(item),
      focused: false,
    };
  });

  return {
    schemaVersion: SCHEMA_VERSION,
    accountId: account.id,
    dateKey,
    tasks,
    suppressedScheduleIds: [],
  };
};

const isTaskStatus = (value: unknown): value is WorkbenchTaskStatus => (
  value === 'pending' || value === 'in_progress' || value === 'completed'
);

const normalizeTaskState = (value: unknown, fallback: WorkbenchTaskState): WorkbenchTaskState => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const candidate = value as Record<string, unknown>;
  const status = isTaskStatus(candidate.status) ? candidate.status : fallback.status;
  const focused = status === 'completed' ? false : candidate.focused === true;
  const focusSource = candidate.focusSource === 'ai' || candidate.focusSource === 'manual'
    ? candidate.focusSource
    : undefined;
  const focusMethod = candidate.focusMethod === 'manual' || candidate.focusMethod === 'automatic'
    ? candidate.focusMethod
    : undefined;

  return {
    status,
    focused,
    ...(focused && focusSource ? { focusSource } : {}),
    ...(focused && focusMethod ? { focusMethod } : {}),
  };
};

const storageKey = (accountId: string, dateKey: string) => `${STORAGE_PREFIX}.${accountId}.${dateKey}`;

export const normalizeWorkbenchTaskSnapshot = (
  value: unknown,
  account: RoleAccount,
  dateKey = getWorkbenchDateKey(),
): WorkbenchTaskSnapshot => {
  const fallback = createInitialWorkbenchTaskSnapshot(account, dateKey);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const candidate = value as Record<string, unknown>;
  if (
    candidate.schemaVersion !== SCHEMA_VERSION
    || candidate.accountId !== account.id
    || candidate.dateKey !== dateKey
    || !candidate.tasks
    || typeof candidate.tasks !== 'object'
    || Array.isArray(candidate.tasks)
  ) return fallback;

  const rawTasks = candidate.tasks as Record<string, unknown>;
  const tasks = Object.fromEntries(
    Object.entries(fallback.tasks).map(([key, initial]) => [key, normalizeTaskState(rawTasks[key], initial)]),
  );
  const validScheduleIds = new Set(account.workbenchSchedule.map((item) => item.id));
  const suppressedScheduleIds = Array.isArray(candidate.suppressedScheduleIds)
    ? [...new Set(candidate.suppressedScheduleIds.filter(
      (id): id is string => typeof id === 'string' && validScheduleIds.has(id),
    ))]
    : [];

  return { ...fallback, tasks, suppressedScheduleIds };
};

export const readWorkbenchTaskSnapshot = (
  account: RoleAccount,
  dateKey = getWorkbenchDateKey(),
): WorkbenchTaskSnapshot => {
  if (typeof window === 'undefined') return createInitialWorkbenchTaskSnapshot(account, dateKey);
  try {
    const raw = window.localStorage.getItem(storageKey(account.id, dateKey));
    return raw
      ? normalizeWorkbenchTaskSnapshot(JSON.parse(raw), account, dateKey)
      : createInitialWorkbenchTaskSnapshot(account, dateKey);
  } catch {
    return createInitialWorkbenchTaskSnapshot(account, dateKey);
  }
};

export const saveWorkbenchTaskSnapshot = (snapshot: WorkbenchTaskSnapshot) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(snapshot.accountId, snapshot.dateKey), JSON.stringify(snapshot));
  } catch {
    // Demo state is a progressive enhancement; CRM actions remain usable without storage.
  }
};

export const resetWorkbenchTaskSnapshots = () => {
  if (typeof window === 'undefined') return;
  try {
    const keys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index));
    keys.forEach((key) => {
      if (key?.startsWith(`${STORAGE_PREFIX}.`)) window.localStorage.removeItem(key);
    });
  } catch {
    // Settings stays usable if local storage is unavailable.
  }
};

export const getWorkbenchTaskState = (
  snapshot: WorkbenchTaskSnapshot,
  reference: WorkbenchTaskReference,
): WorkbenchTaskState => snapshot.tasks[getWorkbenchTaskKey(reference)] || { status: 'pending', focused: false };

const withTask = (
  snapshot: WorkbenchTaskSnapshot,
  reference: WorkbenchTaskReference,
  update: (current: WorkbenchTaskState) => WorkbenchTaskState,
): WorkbenchTaskSnapshot => {
  const key = getWorkbenchTaskKey(reference);
  const current = getWorkbenchTaskState(snapshot, reference);
  return { ...snapshot, tasks: { ...snapshot.tasks, [key]: update(current) } };
};

export const startWorkbenchTask = (snapshot: WorkbenchTaskSnapshot, reference: WorkbenchTaskReference) => (
  withTask(snapshot, reference, (current) => current.status === 'pending' ? { ...current, status: 'in_progress' } : current)
);

export const completeWorkbenchTask = (snapshot: WorkbenchTaskSnapshot, reference: WorkbenchTaskReference) => (
  withTask(snapshot, reference, (current) => ({
    ...current,
    status: 'completed',
    focused: false,
    focusSource: undefined,
    focusMethod: undefined,
  }))
);

export const reopenWorkbenchTask = (
  snapshot: WorkbenchTaskSnapshot,
  reference: WorkbenchTaskReference,
  restoredState?: WorkbenchTaskState,
) => withTask(snapshot, reference, (current) => restoredState || { ...current, status: 'in_progress' });

export const promoteScheduleTask = (
  snapshot: WorkbenchTaskSnapshot,
  scheduleId: string,
  source: 'ai' | 'manual',
  method: 'manual' | 'automatic',
) => {
  const promoted = withTask(snapshot, { kind: 'schedule', id: scheduleId }, (current) => ({
    ...current,
    status: current.status === 'completed' ? 'pending' : current.status,
    focused: true,
    focusSource: source,
    focusMethod: method,
  }));
  return {
    ...promoted,
    suppressedScheduleIds: promoted.suppressedScheduleIds.filter((id) => id !== scheduleId),
  };
};

export const unpinScheduleTask = (snapshot: WorkbenchTaskSnapshot, scheduleId: string) => {
  const unpinned = withTask(snapshot, { kind: 'schedule', id: scheduleId }, (current) => ({
    ...current,
    focused: false,
    focusSource: undefined,
    focusMethod: undefined,
  }));
  return {
    ...unpinned,
    suppressedScheduleIds: [...new Set([...unpinned.suppressedScheduleIds, scheduleId])],
  };
};
