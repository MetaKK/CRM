import {
  AnalyticsAction,
  AnalyticsActorType,
  AnalyticsEventStatus,
  AnalyticsJourney,
  AnalyticsModule,
  AnalyticsPropertyValue,
  AnalyticsRoleType,
  AnalyticsTrustLevel,
  ProductAnalyticsEvent,
  RoleAccount,
} from '../types';

const EVENTS_STORAGE_KEY = 'crm-h5.product-analytics.events.v2';
const LEGACY_EVENTS_STORAGE_KEY = 'crm-h5.product-analytics.events.v1';
const BROWSER_STORAGE_KEY = 'crm-h5.product-analytics.browser.v2';
const MAX_LOCAL_EVENTS = 500;
const SESSION_IDLE_MS = 30 * 60 * 1000;

const actorTypes: AnalyticsActorType[] = ['business', 'operations'];
const roleTypes: AnalyticsRoleType[] = ['product_expert', 'store_manager', 'service_manager', 'regional_director', 'delivery_specialist', 'product_operations'];
const journeys: AnalyticsJourney[] = ['sales', 'service', 'delivery', 'management', 'product_operations'];
const modules: AnalyticsModule[] = ['app', 'workbench', 'work_essential', 'app_center', 'client_360', 'quote', 'test_drive', 'order_delivery', 'xiaowan', 'analytics'];
const actions: AnalyticsAction[] = [
  'app_opened', 'page_viewed', 'role_switched', 'quick_action_started', 'priority_opened', 'schedule_opened',
  'recommendation_shown', 'recommendation_accepted', 'auto_transfer_toggled', 'priority_transferred',
  'transferred_priority_opened', 'layout_reordered', 'tool_launched', 'tool_configured', 'tool_detail_viewed',
  'app_center_opened', 'client_opened', 'client_created', 'client_search_started', 'client_filter_changed',
  'quote_opened', 'quote_generated', 'quote_shared', 'test_drive_booked', 'test_drive_released', 'order_created',
  'contract_opened', 'delivery_started', 'quote_cancelled', 'quote_failed', 'quick_prompt_sent', 'message_sent', 'voice_started', 'period_changed', 'source_explained',
];
const statuses: AnalyticsEventStatus[] = ['viewed', 'started', 'succeeded', 'external_handoff', 'failed', 'cancelled'];
const trustLevels: AnalyticsTrustLevel[] = ['verified_behavior', 'process_proxy', 'unobservable'];
const propertyValues: AnalyticsPropertyValue[] = [
  'workbench', 'clients', 'testdrive', 'orders', 'app_center', 'work_essential', 'quote', 'xiaowan', 'analytics',
  'ai', 'manual', 'automatic', 'all', 'stage', 'add', 'remove', 'reorder', 'priority', 'schedule', 'quote_card', 'tool',
];

const roleTypeByAccountId: Record<string, AnalyticsRoleType> = {
  kian: 'product_expert', chery: 'store_manager', chong: 'service_manager', feishi: 'regional_director',
  liuyang: 'delivery_specialist', operations: 'product_operations',
};
const journeyByRoleType: Record<AnalyticsRoleType, AnalyticsJourney> = {
  product_expert: 'sales', store_manager: 'management', service_manager: 'service', regional_director: 'management',
  delivery_specialist: 'delivery', product_operations: 'product_operations',
};

const includes = <T,>(values: T[], value: unknown): value is T => values.includes(value as T);
const safeGet = (key: string) => { try { return window.localStorage.getItem(key); } catch { return null; } };
const safeSet = (key: string, value: string) => { try { window.localStorage.setItem(key, value); } catch { /* Analytics must never block CRM. */ } };

export const getAnalyticsRoleType = (accountId: string): AnalyticsRoleType => roleTypeByAccountId[accountId] || 'product_expert';
export const getAnalyticsJourney = (account: RoleAccount): AnalyticsJourney => journeyByRoleType[getAnalyticsRoleType(account.id)];
export const getAnalyticsActorType = (account: RoleAccount): AnalyticsActorType => getAnalyticsRoleType(account.id) === 'product_operations' ? 'operations' : 'business';

const getAnonymousBrowserId = () => {
  const existing = safeGet(BROWSER_STORAGE_KEY);
  if (existing && /^browser-[a-z0-9-]{8,}$/i.test(existing)) return existing;
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const next = `browser-${random}`;
  safeSet(BROWSER_STORAGE_KEY, next);
  return next;
};

const isSafeProperties = (value: unknown): value is ProductAnalyticsEvent['properties'] => {
  if (value === undefined) return true;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const props = value as Record<string, unknown>;
  if (Object.keys(props).some((key) => !['source', 'target', 'method', 'stage', 'configurationAction', 'toolType'].includes(key))) return false;
  if (props.source !== undefined && !includes(propertyValues, props.source)) return false;
  if (props.target !== undefined && !includes(propertyValues, props.target)) return false;
  if (props.method !== undefined && !['ai', 'manual', 'automatic'].includes(String(props.method))) return false;
  if (props.stage !== undefined && !['priority', 'schedule'].includes(String(props.stage))) return false;
  if (props.configurationAction !== undefined && !['add', 'remove', 'reorder'].includes(String(props.configurationAction))) return false;
  return props.toolType === undefined || ['quote_card', 'tool'].includes(String(props.toolType));
};

const isAnalyticsEvent = (value: unknown): value is ProductAnalyticsEvent => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  return event.schemaVersion === 2
    && typeof event.id === 'string'
    && typeof event.occurredAt === 'string' && !Number.isNaN(Date.parse(event.occurredAt))
    && typeof event.anonymousBrowserId === 'string' && typeof event.anonymousSessionId === 'string'
    && includes(actorTypes, event.actorType) && includes(roleTypes, event.roleType) && includes(journeys, event.journey)
    && includes(modules, event.module) && includes(actions, event.action) && includes(statuses, event.status)
    && includes(trustLevels, event.trustLevel) && (event.source === 'demo_baseline' || event.source === 'local_realtime')
    && isSafeProperties(event.properties);
};

/** v1 can be read only for backwards-safe storage; it is intentionally excluded from v2 analytics. */
const hasLegacyEvents = () => Boolean(safeGet(LEGACY_EVENTS_STORAGE_KEY));

export const readLocalAnalyticsEvents = (): ProductAnalyticsEvent[] => {
  const raw = safeGet(EVENTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isAnalyticsEvent).slice(-MAX_LOCAL_EVENTS) : [];
  } catch { return []; }
};

export const resetLocalAnalyticsEvents = () => {
  try {
    window.localStorage.removeItem(EVENTS_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_EVENTS_STORAGE_KEY);
  } catch { /* Keep the UI usable when privacy storage is disabled. */ }
};

export type TrackAnalyticsInput = Pick<ProductAnalyticsEvent, 'actorType' | 'roleType' | 'journey' | 'module' | 'action' | 'status' | 'trustLevel' | 'properties'>;

const getRollingSessionId = (browserId: string, now: Date) => {
  const previous = readLocalAnalyticsEvents().filter((event) => event.anonymousBrowserId === browserId).at(-1);
  if (previous && now.getTime() - Date.parse(previous.occurredAt) <= SESSION_IDLE_MS) return previous.anonymousSessionId;
  return `session-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

export const trackAnalyticsEvent = (input: TrackAnalyticsInput): ProductAnalyticsEvent => {
  const now = new Date();
  const browserId = getAnonymousBrowserId();
  const event: ProductAnalyticsEvent = {
    schemaVersion: 2,
    id: `local-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    occurredAt: now.toISOString(),
    anonymousBrowserId: browserId,
    anonymousSessionId: getRollingSessionId(browserId, now),
    source: 'local_realtime',
    ...input,
  };
  safeSet(EVENTS_STORAGE_KEY, JSON.stringify([...readLocalAnalyticsEvents(), event].slice(-MAX_LOCAL_EVENTS)));
  return event;
};

const atDemoTime = (daysAgo: number, hour: number, minute: number) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};
const demoRoles: AnalyticsRoleType[] = ['product_expert', 'store_manager', 'service_manager', 'regional_director', 'delivery_specialist'];

/** Deterministic 56-day baseline. It never writes storage or carries real identifiers. */
export const getDemoAnalyticsEvents = (): ProductAnalyticsEvent[] => {
  const events: ProductAnalyticsEvent[] = [];
  const add = (
    daysAgo: number, session: number, minute: number, module: AnalyticsModule, action: AnalyticsAction,
    status: AnalyticsEventStatus, trustLevel: AnalyticsTrustLevel, properties?: ProductAnalyticsEvent['properties'],
  ) => {
    const roleType = demoRoles[(daysAgo + session) % demoRoles.length];
    const browserId = `demo-browser-${daysAgo}-${session}`;
    events.push({
      schemaVersion: 2,
      id: `demo-${daysAgo}-${session}-${minute}-${action}`,
      occurredAt: atDemoTime(daysAgo, 8 + Math.floor(minute / 60), minute % 60),
      anonymousBrowserId: browserId,
      anonymousSessionId: `demo-session-${daysAgo}-${session}`,
      actorType: 'business', roleType, journey: journeyByRoleType[roleType], module, action, status, trustLevel,
      source: 'demo_baseline', properties,
    });
  };

  for (let daysAgo = 0; daysAgo < 56; daysAgo += 1) {
    const sessions = 6 + ((daysAgo * 3) % 4);
    for (let session = 0; session < sessions; session += 1) {
      const role = demoRoles[(daysAgo + session) % demoRoles.length];
      add(daysAgo, session, 0, 'app', 'app_opened', 'viewed', 'verified_behavior');
      add(daysAgo, session, 5, 'workbench', 'page_viewed', 'viewed', 'verified_behavior', { target: 'workbench' });
      if (session % 5 !== 4) {
        const stage = session % 2 ? 'schedule' : 'priority';
        add(daysAgo, session, 12, 'workbench', stage === 'priority' ? 'priority_opened' : 'schedule_opened', 'viewed', 'verified_behavior', { stage });
      }
      if (role === 'product_expert' && session % 3 !== 2) {
        add(daysAgo, session, 19, 'client_360', 'client_opened', 'viewed', 'process_proxy', { source: 'workbench' });
        add(daysAgo, session, 27, 'quote', 'quote_opened', 'started', 'process_proxy', { source: 'clients' });
        if (session % 2 === 0) add(daysAgo, session, 34, 'quote', 'quote_generated', 'succeeded', 'verified_behavior', { toolType: 'quote_card' });
        if ((daysAgo + session) % 4 === 0) add(daysAgo, session, 38, 'quote', 'quote_shared', 'external_handoff', 'process_proxy', { toolType: 'quote_card' });
      } else if (role === 'service_manager' && session % 3 !== 2) {
        add(daysAgo, session, 19, 'order_delivery', 'page_viewed', 'viewed', 'process_proxy', { target: 'orders' });
        if (session % 2 === 0) add(daysAgo, session, 30, 'test_drive', 'test_drive_booked', 'started', 'process_proxy');
      } else if (role === 'delivery_specialist' && session % 3 !== 2) {
        add(daysAgo, session, 19, 'order_delivery', 'page_viewed', 'viewed', 'process_proxy', { target: 'orders' });
        if (session % 2 === 0) add(daysAgo, session, 30, 'order_delivery', 'delivery_started', 'started', 'process_proxy');
      } else if ((role === 'store_manager' || role === 'regional_director') && session % 3 !== 2) {
        add(daysAgo, session, 19, 'work_essential', 'page_viewed', 'viewed', 'process_proxy', { target: 'work_essential' });
        if (session % 2 === 0) add(daysAgo, session, 30, 'app', 'quick_action_started', 'started', 'process_proxy');
      }
      if (session % 2 === 0 || session === 1) add(daysAgo, session, 43, 'app_center', 'app_center_opened', 'viewed', 'verified_behavior');
      if (session % 2 === 0) add(daysAgo, session, 46, 'app_center', 'tool_detail_viewed', 'viewed', 'verified_behavior', { toolType: 'tool' });
      if (session === 0 || (daysAgo % 4 === 0 && session === 3)) add(daysAgo, session, 49, 'work_essential', 'tool_configured', 'succeeded', 'verified_behavior', { configurationAction: 'add', toolType: 'tool' });
      if (session % 3 === 0) add(daysAgo, session, 57, 'work_essential', 'tool_launched', 'started', 'process_proxy', { toolType: 'tool' });
      if (session === 1 || (daysAgo % 3 === 0 && session === 4)) {
        add(daysAgo, session, 61, 'workbench', 'recommendation_shown', 'viewed', 'verified_behavior', { method: 'ai' });
        if (daysAgo % 2 === 0) {
          add(daysAgo, session, 65, 'workbench', 'recommendation_accepted', 'succeeded', 'verified_behavior', { method: 'ai' });
          add(daysAgo, session, 66, 'workbench', 'priority_transferred', 'succeeded', 'verified_behavior', { method: 'manual' });
        } else {
          add(daysAgo, session, 65, 'workbench', 'priority_transferred', 'succeeded', 'verified_behavior', { method: 'automatic' });
        }
      }
      if (session % 4 === 0) add(daysAgo, session, 70, 'workbench', 'layout_reordered', 'succeeded', 'verified_behavior', { configurationAction: 'reorder' });
      if (session % 3 === 1) add(daysAgo, session, 76, 'xiaowan', 'quick_prompt_sent', 'started', 'process_proxy');
    }
  }
  return events;
};

export type AnalyticsDataHealth = { localEvents: number; legacyEventsDetected: boolean; invalidOrUnknownEvents: boolean };
export const getAnalyticsDataHealth = (): AnalyticsDataHealth => ({
  localEvents: readLocalAnalyticsEvents().length,
  legacyEventsDetected: hasLegacyEvents(),
  invalidOrUnknownEvents: Boolean(safeGet(EVENTS_STORAGE_KEY)) && readLocalAnalyticsEvents().length === 0,
});
export const getMergedAnalyticsEvents = () => [...getDemoAnalyticsEvents(), ...readLocalAnalyticsEvents()];
export const getStartOfDay = (date = new Date()) => { const next = new Date(date); next.setHours(0, 0, 0, 0); return next; };
export const isEventInRange = (event: ProductAnalyticsEvent, start: Date, end: Date) => { const time = Date.parse(event.occurredAt); return time >= start.getTime() && time < end.getTime(); };

export type OrderedFunnelStep = {
  id: string;
  matches: (event: ProductAnalyticsEvent) => boolean;
};

export type OrderedFunnelResult = {
  counts: number[];
  qualifiedSessions: number;
  completedDurationsMs: number[];
};

/**
 * Computes an ordered, same-session funnel. A session contributes to a later
 * step only if it completed every preceding step in chronological order.
 * This deliberately avoids the misleading "event set intersection" shortcut.
 */
export const calculateOrderedFunnel = (
  events: ProductAnalyticsEvent[],
  steps: OrderedFunnelStep[],
): OrderedFunnelResult => {
  const counts = steps.map(() => 0);
  const sessions = new Map<string, ProductAnalyticsEvent[]>();
  events.forEach((event) => {
    const group = sessions.get(event.anonymousSessionId) || [];
    group.push(event);
    sessions.set(event.anonymousSessionId, group);
  });
  const completedDurationsMs: number[] = [];

  sessions.forEach((sessionEvents) => {
    const ordered = [...sessionEvents].sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
    let cursor = -1;
    let firstTime: number | null = null;
    let reached = 0;
    for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
      const nextIndex = ordered.findIndex((event, index) => index > cursor && steps[stepIndex].matches(event));
      if (nextIndex < 0) break;
      cursor = nextIndex;
      const matchedAt = Date.parse(ordered[nextIndex].occurredAt);
      if (firstTime === null) firstTime = matchedAt;
      counts[stepIndex] += 1;
      reached += 1;
      if (stepIndex === steps.length - 1 && firstTime !== null) completedDurationsMs.push(matchedAt - firstTime);
    }
    void reached;
  });

  return { counts, qualifiedSessions: counts[steps.length - 1] || 0, completedDurationsMs };
};

export const median = (values: number[]) => {
  if (!values.length) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
};
