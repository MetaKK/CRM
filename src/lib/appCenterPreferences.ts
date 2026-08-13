const STORAGE_PREFIX = 'crm-h5.app-center-preferences.v1';
const MAX_RECENT_APP_TOOLS = 6;

const storageKey = (accountId: string) => `${STORAGE_PREFIX}.${accountId}`;

const normalize = (value: unknown, availableToolIds: string[]) => {
  const raw = Array.isArray(value) ? value : [];
  return [...new Set(raw.filter((id): id is string => typeof id === 'string' && availableToolIds.includes(id)))].slice(0, MAX_RECENT_APP_TOOLS);
};

export const readRecentAppToolIds = (accountId: string, availableToolIds: string[]) => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(accountId));
    if (!raw) return [];
    return normalize(JSON.parse(raw)?.recentToolIds, availableToolIds);
  } catch {
    return [];
  }
};

export const recordRecentAppToolId = (accountId: string, toolId: string, availableToolIds: string[]) => {
  const current = readRecentAppToolIds(accountId, availableToolIds);
  const recentToolIds = [toolId, ...current.filter((id) => id !== toolId)].slice(0, MAX_RECENT_APP_TOOLS);
  try {
    window.localStorage.setItem(storageKey(accountId), JSON.stringify({ recentToolIds }));
  } catch {
    // Recent use is an enhancement only. CRM actions must remain available if storage is disabled.
  }
  return recentToolIds;
};
