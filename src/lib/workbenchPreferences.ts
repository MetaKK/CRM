import { WorkbenchPreferences, WorkbenchSectionId } from '../types';

export const MAX_QUICK_TOOLS = 4;

export const DEFAULT_WORKBENCH_SECTION_ORDER: WorkbenchSectionId[] = [
  'focus',
  'pulse',
  'tools',
];

const STORAGE_PREFIX = 'crm-h5.workbench-preferences.v1';

const isSectionId = (value: unknown): value is WorkbenchSectionId =>
  typeof value === 'string' && DEFAULT_WORKBENCH_SECTION_ORDER.includes(value as WorkbenchSectionId);

const normalizeSectionOrder = (value: unknown): WorkbenchSectionId[] => {
  const raw = Array.isArray(value) ? value : [];
  const isLegacyLayout = raw.some((section) => section === 'priority' || section === 'schedule');

  // Priority and schedule are now one decision card. Their former relative position is no longer
  // meaningful, so migrate existing four-card layouts to the new recommended default once.
  if (isLegacyLayout) return [...DEFAULT_WORKBENCH_SECTION_ORDER];

  const candidate = raw.filter(isSectionId);
  const unique = [...new Set(candidate)];
  return [...unique, ...DEFAULT_WORKBENCH_SECTION_ORDER.filter((section) => !unique.includes(section))];
};

const normalizeQuickToolIds = (value: unknown, availableToolIds: string[], defaults: string[]): string[] => {
  const candidate = Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : defaults;
  const valid = candidate.filter((id) => availableToolIds.includes(id));
  return [...new Set(valid)].slice(0, MAX_QUICK_TOOLS);
};

export const createDefaultWorkbenchPreferences = (defaultQuickToolIds: string[], autoPromoteEnabled = false): WorkbenchPreferences => ({
  sectionOrder: [...DEFAULT_WORKBENCH_SECTION_ORDER],
  quickToolIds: defaultQuickToolIds.slice(0, MAX_QUICK_TOOLS),
  autoPromoteEnabled,
});

export const readWorkbenchPreferences = (
  accountId: string,
  availableToolIds: string[],
  defaultQuickToolIds: string[],
  autoPromoteEnabled = false,
): WorkbenchPreferences => {
  const fallback = createDefaultWorkbenchPreferences(defaultQuickToolIds, autoPromoteEnabled);

  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}.${accountId}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<WorkbenchPreferences>;
    return {
      sectionOrder: normalizeSectionOrder(parsed.sectionOrder),
      quickToolIds: normalizeQuickToolIds(parsed.quickToolIds, availableToolIds, defaultQuickToolIds),
      autoPromoteEnabled: typeof parsed.autoPromoteEnabled === 'boolean'
        ? parsed.autoPromoteEnabled
        : autoPromoteEnabled,
    };
  } catch {
    return fallback;
  }
};

export const saveWorkbenchPreferences = (accountId: string, preferences: WorkbenchPreferences) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}.${accountId}`, JSON.stringify(preferences));
  } catch {
    // Local layout is a progressive enhancement; the workbench remains usable if storage is unavailable.
  }
};
