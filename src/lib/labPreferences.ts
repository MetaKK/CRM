const STORAGE_KEY = 'crm-h5.frontline-lab-supports.v1';

const normalize = (value: unknown, availableToolIds: string[]) => {
  const ids = Array.isArray(value) ? value : [];
  return [...new Set(ids.filter((id): id is string => typeof id === 'string' && availableToolIds.includes(id)))];
};

export const readSupportedLabToolIds = (availableToolIds: string[]) => {
  if (typeof window === 'undefined') return [];
  try {
    return normalize(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]'), availableToolIds);
  } catch {
    return [];
  }
};

export const toggleSupportedLabToolId = (toolId: string, availableToolIds: string[]) => {
  const current = readSupportedLabToolIds(availableToolIds);
  const next = current.includes(toolId)
    ? current.filter((id) => id !== toolId)
    : [...current, toolId];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Supporting an experiment is optional; storage must never block the Lab.
  }
  return next;
};
