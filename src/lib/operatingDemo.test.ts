import { describe, expect, it } from 'vitest';
import { businessDemoRecords, mockRoleAccounts } from '../data/mockData';
import {
  createInitialOperatingSnapshot,
  getInsightPresentation,
  getOperatingMetricValue,
  normalizeOperatingSnapshot,
  updateOperatingRecord,
} from './operatingDemo';

describe('operating overview demo state', () => {
  const productExpert = mockRoleAccounts.find((account) => account.id === 'kian')!;

  it('seeds only the selected role records', () => {
    const snapshot = createInitialOperatingSnapshot('kian', '2026-08-14');
    expect(Object.keys(snapshot.records)).toEqual(
      businessDemoRecords.filter((record) => record.roleId === 'kian').map((record) => record.id),
    );
    expect(snapshot.records['approval-1']).toBeUndefined();
  });

  it('updates linked pending metrics only after a confirmed resolution', () => {
    const metric = productExpert.workbenchMetrics.find((item) => item.id === 'kian-pending-quote')!;
    const initial = createInitialOperatingSnapshot('kian', '2026-08-14');
    const started = updateOperatingRecord(initial, 'kian-quote-c3', 'in_progress');
    const confirmed = updateOperatingRecord(started, 'kian-quote-c3', 'completed');

    expect(getOperatingMetricValue(metric, 'today', initial)).toBe(2);
    expect(getOperatingMetricValue(metric, 'today', started)).toBe(2);
    expect(getOperatingMetricValue(metric, 'today', confirmed)).toBe(1);
  });

  it('turns the signal into a resolved state when every linked sample is closed', () => {
    const initial = createInitialOperatingSnapshot('kian', '2026-08-14');
    const first = updateOperatingRecord(initial, 'kian-quote-c3', 'completed');
    const complete = updateOperatingRecord(first, 'kian-quote-c5', 'completed');
    const insight = getInsightPresentation(productExpert, 'today', complete);

    expect(insight.resolved).toBe(true);
    expect(insight.title).toBe('今日待报价客户已处理完');
    expect(insight.actionLabel).toBe('查看经营数据');
  });

  it('drops unknown and damaged cached fields safely', () => {
    const normalized = normalizeOperatingSnapshot({
      schemaVersion: 1,
      accountId: 'kian',
      dateKey: '2026-08-14',
      records: { 'kian-quote-c3': 'completed', unknown: 'completed', 'kian-quote-c5': 'broken' },
    }, 'kian', '2026-08-14');

    expect(normalized.records['kian-quote-c3']).toBe('completed');
    expect(normalized.records['kian-quote-c5']).toBe('pending');
    expect(normalized.records.unknown).toBeUndefined();
    expect(Object.keys(normalized.records)).toHaveLength(
      businessDemoRecords.filter((record) => record.roleId === 'kian').length,
    );
  });
});
