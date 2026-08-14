import { describe, expect, it } from 'vitest';
import { calculateOrderedFunnel, getDemoAnalyticsEvents } from './productAnalytics';

describe('workbench closure analytics', () => {
  it('keeps manual adoption and automatic execution distinguishable', () => {
    const events = getDemoAnalyticsEvents();
    const shown = events.filter((event) => event.action === 'recommendation_shown');
    const promoted = events.filter((event) => event.action === 'priority_promoted');

    expect(shown.some((event) => event.properties?.method === 'manual')).toBe(true);
    expect(shown.some((event) => event.properties?.method === 'automatic')).toBe(true);
    expect(promoted.some((event) => event.properties?.method === 'manual')).toBe(true);
    expect(promoted.some((event) => event.properties?.method === 'automatic')).toBe(true);
  });

  it('computes the new recommendation-to-completion path in strict order', () => {
    const funnel = calculateOrderedFunnel(getDemoAnalyticsEvents(), [
      { id: 'shown', matches: (event) => event.action === 'recommendation_shown' },
      { id: 'promoted', matches: (event) => event.action === 'priority_promoted' },
      { id: 'opened', matches: (event) => event.action === 'transferred_priority_opened' },
      { id: 'completed', matches: (event) => event.action === 'task_completed' },
    ]);

    expect(funnel.counts[0]).toBeGreaterThan(0);
    expect(funnel.counts[0]).toBeGreaterThanOrEqual(funnel.counts[1]);
    expect(funnel.counts[1]).toBeGreaterThanOrEqual(funnel.counts[2]);
    expect(funnel.counts[2]).toBeGreaterThanOrEqual(funnel.counts[3]);
  });

  it('uses enum-only properties for the new closure events', () => {
    const events = getDemoAnalyticsEvents().filter((event) => (
      ['recommendation_shown', 'priority_promoted', 'task_started', 'task_completed'].includes(event.action)
    ));
    const allowedKeys = new Set(['source', 'target', 'method', 'stage', 'configurationAction', 'toolType', 'toggleState']);

    events.forEach((event) => {
      Object.keys(event.properties || {}).forEach((key) => expect(allowedKeys.has(key)).toBe(true));
      Object.values(event.properties || {}).forEach((value) => expect(typeof value).toBe('string'));
    });
  });
});
