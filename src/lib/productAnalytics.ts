import {
  AnalyticsAction,
  AnalyticsActorType,
  AnalyticsModule,
  AnalyticsPropertyValue,
  AnalyticsResult,
  AnalyticsRoleType,
  ProductAnalyticsEvent,
  RoleAccount,
} from '../types';

const EVENTS_STORAGE_KEY = 'crm-h5.product-analytics.events.v1';
const SESSION_STORAGE_KEY = 'crm-h5.product-analytics.session.v1';
const MAX_LOCAL_EVENTS = 500;

const actorTypes: AnalyticsActorType[] = ['business', 'operations'];
const roleTypes: AnalyticsRoleType[] = [
  'product_expert',
  'store_manager',
  'service_manager',
  'regional_director',
  'delivery_specialist',
  'product_operations',
];
const modules: AnalyticsModule[] = [
  'app', 'workbench', 'work_essential', 'app_center', 'client_360', 'quote',
  'test_drive', 'order_delivery', 'xiaowan', 'analytics',
];
const actions: AnalyticsAction[] = [
  'app_opened', 'page_viewed', 'role_switched', 'quick_action_started', 'priority_opened',
  'schedule_opened', 'auto_transfer_toggled', 'auto_transfer_executed', 'layout_reordered',
  'tool_launched', 'tool_configured', 'app_center_opened', 'client_opened', 'client_created',
  'client_search_started', 'client_filter_changed', 'quote_opened', 'quote_generated',
  'quote_shared', 'test_drive_booked', 'test_drive_released', 'order_created', 'contract_opened',
  'delivery_started', 'quick_prompt_sent', 'message_sent', 'voice_started', 'period_changed',
  'source_explained',
];
const results: AnalyticsResult[] = ['success', 'enabled', 'disabled', 'started', 'completed'];
const propertyValues: AnalyticsPropertyValue[] = [
  'workbench', 'clients', 'testdrive', 'orders', 'app_center', 'work_essential',
  'quote', 'xiaowan', 'analytics', 'ai', 'manual', 'automatic', 'all', 'stage',
];

const includes = <T,>(values: T[], value: unknown): value is T => values.includes(value as T);

const roleTypeByAccountId: Record<string, AnalyticsRoleType> = {
  kian: 'product_expert',
  chery: 'store_manager',
  chong: 'service_manager',
  feishi: 'regional_director',
  liuyang: 'delivery_specialist',
  operations: 'product_operations',
};

export const getAnalyticsRoleType = (accountId: string): AnalyticsRoleType =>
  roleTypeByAccountId[accountId] || 'product_expert';

export const getAnalyticsActorType = (account: RoleAccount): AnalyticsActorType =>
  getAnalyticsRoleType(account.id) === 'product_operations' ? 'operations' : 'business';

const safeGet = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Local-only analytics must never block the CRM when storage is unavailable.
  }
};

const getAnonymousSessionId = () => {
  const existing = safeGet(SESSION_STORAGE_KEY);
  if (existing && /^session-[a-z0-9-]{8,}$/i.test(existing)) return existing;

  const random = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const next = `session-${random}`;
  safeSet(SESSION_STORAGE_KEY, next);
  return next;
};

const isSafeProperties = (value: unknown): value is ProductAnalyticsEvent['properties'] => {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const properties = value as Record<string, unknown>;
  const allowedKeys = ['source', 'target', 'method'];
  if (Object.keys(properties).some((key) => !allowedKeys.includes(key))) return false;
  if (properties.source !== undefined && !includes(propertyValues, properties.source)) return false;
  if (properties.target !== undefined && !includes(propertyValues, properties.target)) return false;
  return properties.method === undefined || properties.method === 'ai' || properties.method === 'manual' || properties.method === 'automatic';
};

const isAnalyticsEvent = (value: unknown): value is ProductAnalyticsEvent => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  return typeof event.id === 'string'
    && typeof event.occurredAt === 'string'
    && !Number.isNaN(Date.parse(event.occurredAt))
    && typeof event.anonymousSessionId === 'string'
    && includes(actorTypes, event.actorType)
    && includes(roleTypes, event.roleType)
    && includes(modules, event.module)
    && includes(actions, event.action)
    && includes(results, event.result)
    && isSafeProperties(event.properties);
};

export const readLocalAnalyticsEvents = (): ProductAnalyticsEvent[] => {
  const raw = safeGet(EVENTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isAnalyticsEvent).slice(-MAX_LOCAL_EVENTS);
  } catch {
    return [];
  }
};

export const resetLocalAnalyticsEvents = () => {
  try {
    window.localStorage.removeItem(EVENTS_STORAGE_KEY);
  } catch {
    // Keep the UI usable when privacy storage is disabled.
  }
};

export type TrackAnalyticsInput = Pick<
  ProductAnalyticsEvent,
  'actorType' | 'roleType' | 'module' | 'action' | 'result' | 'properties'
>;

export const trackAnalyticsEvent = (input: TrackAnalyticsInput): ProductAnalyticsEvent => {
  const now = new Date();
  const event: ProductAnalyticsEvent = {
    id: `local-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    occurredAt: now.toISOString(),
    anonymousSessionId: getAnonymousSessionId(),
    ...input,
  };
  const localEvents = [...readLocalAnalyticsEvents(), event].slice(-MAX_LOCAL_EVENTS);
  safeSet(EVENTS_STORAGE_KEY, JSON.stringify(localEvents));
  return event;
};

const atDemoTime = (daysAgo: number, hour: number, minute: number) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

const demoRoles: AnalyticsRoleType[] = [
  'product_expert', 'store_manager', 'service_manager', 'regional_director', 'delivery_specialist',
];

/**
 * Deterministic, non-production events for the rolling demo window. It creates
 * no storage and carries no identifiers beyond synthetic sessions.
 */
export const getDemoAnalyticsEvents = (): ProductAnalyticsEvent[] => {
  const events: ProductAnalyticsEvent[] = [];
  const add = (
    daysAgo: number,
    session: number,
    minuteOffset: number,
    module: AnalyticsModule,
    action: AnalyticsAction,
    result: AnalyticsResult = 'success',
    properties?: ProductAnalyticsEvent['properties'],
  ) => {
    const roleType = demoRoles[(daysAgo + session) % demoRoles.length];
    events.push({
      id: `demo-${daysAgo}-${session}-${minuteOffset}-${action}`,
      occurredAt: atDemoTime(daysAgo, 8 + Math.floor(minuteOffset / 60), minuteOffset % 60),
      anonymousSessionId: `demo-session-${daysAgo}-${session}`,
      actorType: 'business',
      roleType,
      module,
      action,
      result,
      properties,
    });
  };

  // Fourteen days support an honest comparison period for both "近 7 天" and "今日".
  for (let daysAgo = 0; daysAgo < 14; daysAgo += 1) {
    const sessionCount = 6 + ((daysAgo * 3) % 4);
    for (let session = 0; session < sessionCount; session += 1) {
      add(daysAgo, session, 0, 'app', 'app_opened');
      add(daysAgo, session, 8, 'workbench', 'page_viewed', 'success', { target: 'workbench' });
      if (session % 5 !== 4) add(daysAgo, session, 14, 'workbench', 'priority_opened', 'completed');
      if (session % 3 !== 2) {
        add(daysAgo, session, 24, 'client_360', 'page_viewed', 'success', { target: 'clients' });
        add(daysAgo, session, 27, 'client_360', 'client_opened', 'completed', { source: 'workbench' });
      }
      if (session % 2 === 0) {
        add(daysAgo, session, 36, 'quote', 'quote_opened', 'started', { source: 'clients' });
        add(daysAgo, session, 42, 'quote', 'quote_generated', 'completed');
        if ((daysAgo + session) % 4 === 0) add(daysAgo, session, 47, 'quote', 'quote_shared', 'completed');
      }
      // Deliberately high discovery and low configuration creates a meaningful demo insight.
      if (session % 2 === 0 || session === 1) add(daysAgo, session, 52, 'app_center', 'app_center_opened');
      if (session === 0 || (daysAgo % 4 === 0 && session === 3)) {
        add(daysAgo, session, 55, 'work_essential', 'tool_configured', 'completed');
      }
      if (session % 3 === 0) add(daysAgo, session, 58, 'work_essential', 'tool_launched', 'completed');
      if (session === 1 || (daysAgo % 3 === 0 && session === 4)) {
        add(daysAgo, session, 61, 'workbench', 'auto_transfer_toggled', 'enabled', { method: 'automatic' });
        add(daysAgo, session, 64, 'workbench', 'auto_transfer_executed', 'completed', { method: 'ai' });
      }
      if (session % 4 === 0) add(daysAgo, session, 68, 'workbench', 'layout_reordered', 'completed');
      if (session % 4 === 1) add(daysAgo, session, 72, 'test_drive', 'test_drive_booked', 'started');
      if (session % 5 === 1) add(daysAgo, session, 75, 'order_delivery', 'delivery_started', 'started');
      if (session % 3 === 1) add(daysAgo, session, 79, 'xiaowan', 'quick_prompt_sent', 'completed');
    }
  }
  return events;
};

export const getMergedAnalyticsEvents = () => [...getDemoAnalyticsEvents(), ...readLocalAnalyticsEvents()];

export const getStartOfDay = (date = new Date()) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const isEventInRange = (event: ProductAnalyticsEvent, start: Date, end: Date) => {
  const time = Date.parse(event.occurredAt);
  return time >= start.getTime() && time < end.getTime();
};
