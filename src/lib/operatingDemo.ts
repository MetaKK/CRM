import { businessDemoRecords } from '../data/mockData';
import {
  BusinessDemoRecord,
  BusinessRecordStatus,
  OperatingDemoSnapshot,
  OperatingPeriod,
  RoleAccount,
  WorkbenchInsightPeriod,
  WorkbenchOperatingMetric,
} from '../types';
import { getWorkbenchDateKey } from './workbenchTasks';

const SNAPSHOT_PREFIX = 'crm-h5.operating-demo.v1';
const PERIOD_PREFIX = 'crm-h5.operating-period.v1';
const SCHEMA_VERSION = 1 as const;

const isStatus = (value: unknown): value is BusinessRecordStatus => (
  value === 'pending' || value === 'in_progress' || value === 'completed' || value === 'rejected'
);

const snapshotKey = (accountId: string, dateKey: string) => `${SNAPSHOT_PREFIX}.${accountId}.${dateKey}`;
const periodKey = (accountId: string) => `${PERIOD_PREFIX}.${accountId}`;

export const getBusinessRecordsForRole = (accountId: string) => (
  businessDemoRecords.filter((record) => record.roleId === accountId)
);

export const createInitialOperatingSnapshot = (
  accountId: string,
  dateKey = getWorkbenchDateKey(),
): OperatingDemoSnapshot => ({
  schemaVersion: SCHEMA_VERSION,
  accountId,
  dateKey,
  records: Object.fromEntries(
    getBusinessRecordsForRole(accountId).map((record) => [record.id, record.initialStatus]),
  ),
});

export const normalizeOperatingSnapshot = (
  value: unknown,
  accountId: string,
  dateKey = getWorkbenchDateKey(),
): OperatingDemoSnapshot => {
  const fallback = createInitialOperatingSnapshot(accountId, dateKey);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const candidate = value as Record<string, unknown>;
  if (
    candidate.schemaVersion !== SCHEMA_VERSION
    || candidate.accountId !== accountId
    || candidate.dateKey !== dateKey
    || !candidate.records
    || typeof candidate.records !== 'object'
    || Array.isArray(candidate.records)
  ) return fallback;

  const rawRecords = candidate.records as Record<string, unknown>;
  const records = Object.fromEntries(
    Object.entries(fallback.records).map(([id, initial]) => [id, isStatus(rawRecords[id]) ? rawRecords[id] : initial]),
  );
  return { ...fallback, records };
};

export const readOperatingSnapshot = (
  accountId: string,
  dateKey = getWorkbenchDateKey(),
): OperatingDemoSnapshot => {
  if (typeof window === 'undefined') return createInitialOperatingSnapshot(accountId, dateKey);
  try {
    const raw = window.localStorage.getItem(snapshotKey(accountId, dateKey));
    return raw ? normalizeOperatingSnapshot(JSON.parse(raw), accountId, dateKey) : createInitialOperatingSnapshot(accountId, dateKey);
  } catch {
    return createInitialOperatingSnapshot(accountId, dateKey);
  }
};

export const saveOperatingSnapshot = (snapshot: OperatingDemoSnapshot) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(snapshotKey(snapshot.accountId, snapshot.dateKey), JSON.stringify(snapshot));
  } catch {
    // The demo remains usable when local storage is unavailable.
  }
};

export const updateOperatingRecord = (
  snapshot: OperatingDemoSnapshot,
  recordId: string,
  status: BusinessRecordStatus,
): OperatingDemoSnapshot => (
  Object.prototype.hasOwnProperty.call(snapshot.records, recordId)
    ? { ...snapshot, records: { ...snapshot.records, [recordId]: status } }
    : snapshot
);

export const getOperatingRecordStatus = (
  snapshot: OperatingDemoSnapshot,
  record: BusinessDemoRecord,
) => snapshot.records[record.id] || record.initialStatus;

export const isOperatingRecordResolved = (status: BusinessRecordStatus) => status === 'completed' || status === 'rejected';

export const getOperatingMetricValue = (
  metric: WorkbenchOperatingMetric,
  period: OperatingPeriod,
  snapshot: OperatingDemoSnapshot,
) => {
  const resolved = (metric.linkedActionIds || []).filter((id) => isOperatingRecordResolved(snapshot.records[id])).length;
  return Math.max(0, metric.values[period] - resolved);
};

export const formatOperatingValue = (value: number) => (
  Number.isInteger(value) ? String(value) : value.toFixed(1)
);

export const getInsightPresentation = (
  account: RoleAccount,
  period: OperatingPeriod,
  snapshot: OperatingDemoSnapshot,
): WorkbenchInsightPeriod & { resolved: boolean } => {
  const insight = account.workbenchInsight.periods[period];
  const countMetric = account.workbenchMetrics.find((metric) => metric.id === insight.countMetricId);
  const count = countMetric ? getOperatingMetricValue(countMetric, period, snapshot) : null;
  const resolved = count === 0 && Boolean(countMetric);
  const replaceCount = (text: string) => count === null ? text : text.replace('{count}', String(count));
  return {
    ...insight,
    title: resolved && insight.resolvedTitle ? insight.resolvedTitle : replaceCount(insight.title),
    description: resolved && insight.resolvedDescription ? insight.resolvedDescription : insight.description,
    actionLabel: resolved ? '查看经营数据' : insight.actionLabel,
    resolved,
  };
};

export const readOperatingPeriod = (accountId: string): OperatingPeriod => {
  if (typeof window === 'undefined') return 'today';
  try {
    const value = window.localStorage.getItem(periodKey(accountId));
    return value === 'seven_days' || value === 'month' ? value : 'today';
  } catch {
    return 'today';
  }
};

export const saveOperatingPeriod = (accountId: string, period: OperatingPeriod) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(periodKey(accountId), period);
  } catch {
    // Period persistence is optional.
  }
};

export const resetOperatingSnapshots = () => {
  if (typeof window === 'undefined') return;
  try {
    const keys = Array.from({ length: window.localStorage.length }, (_, index) => window.localStorage.key(index));
    keys.forEach((key) => {
      if (key?.startsWith(`${SNAPSHOT_PREFIX}.`)) window.localStorage.removeItem(key);
    });
  } catch {
    // Settings remains usable when storage access is restricted.
  }
};

export const operatingPeriodLabels: Record<OperatingPeriod, string> = {
  today: '今日',
  seven_days: '近 7 天',
  month: '本月',
};

