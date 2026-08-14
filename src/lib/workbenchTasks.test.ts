import { describe, expect, it } from 'vitest';
import { mockRoleAccounts } from '../data/mockData';
import {
  completeWorkbenchTask,
  createInitialWorkbenchTaskSnapshot,
  getWorkbenchTaskState,
  normalizeWorkbenchTaskSnapshot,
  promoteScheduleTask,
  reopenWorkbenchTask,
  startWorkbenchTask,
  unpinScheduleTask,
} from './workbenchTasks';

const account = (id: string) => {
  const result = mockRoleAccounts.find((item) => item.id === id);
  if (!result) throw new Error(`Missing mock account: ${id}`);
  return result;
};

describe('workbench task state', () => {
  it('seeds priorities as focused and respects completed schedule fixtures', () => {
    const kian = createInitialWorkbenchTaskSnapshot(account('kian'), '2026-08-14');
    const manager = createInitialWorkbenchTaskSnapshot(account('chery'), '2026-08-14');

    expect(getWorkbenchTaskState(kian, { kind: 'priority', id: 'kian-sla' })).toEqual({
      status: 'pending',
      focused: true,
    });
    expect(getWorkbenchTaskState(manager, { kind: 'schedule', id: 'chery-0930' }).status).toBe('completed');
  });

  it('runs pending to in-progress to completed and supports exact undo', () => {
    const initial = createInitialWorkbenchTaskSnapshot(account('kian'), '2026-08-14');
    const reference = { kind: 'priority' as const, id: 'kian-sla' };
    const started = startWorkbenchTask(initial, reference);
    const previous = getWorkbenchTaskState(started, reference);
    const completed = completeWorkbenchTask(started, reference);
    const reopened = reopenWorkbenchTask(completed, reference, previous);

    expect(getWorkbenchTaskState(started, reference).status).toBe('in_progress');
    expect(getWorkbenchTaskState(completed, reference)).toMatchObject({ status: 'completed', focused: false });
    expect(getWorkbenchTaskState(reopened, reference)).toEqual(previous);
  });

  it('keeps a promoted schedule task in one canonical record', () => {
    const initial = createInitialWorkbenchTaskSnapshot(account('feishi'), '2026-08-14');
    const promoted = promoteScheduleTask(initial, 'feishi-1400', 'ai', 'automatic');
    const state = getWorkbenchTaskState(promoted, { kind: 'schedule', id: 'feishi-1400' });

    expect(state).toEqual({ status: 'pending', focused: true, focusSource: 'ai', focusMethod: 'automatic' });
    expect(Object.keys(promoted.tasks).filter((key) => key.endsWith('feishi-1400'))).toEqual(['schedule:feishi-1400']);
  });

  it('suppresses an unpinned auto candidate until it is manually promoted again', () => {
    const initial = createInitialWorkbenchTaskSnapshot(account('feishi'), '2026-08-14');
    const promoted = promoteScheduleTask(initial, 'feishi-1400', 'ai', 'automatic');
    const unpinned = unpinScheduleTask(promoted, 'feishi-1400');
    const manual = promoteScheduleTask(unpinned, 'feishi-1400', 'manual', 'manual');

    expect(unpinned.suppressedScheduleIds).toContain('feishi-1400');
    expect(getWorkbenchTaskState(unpinned, { kind: 'schedule', id: 'feishi-1400' }).focused).toBe(false);
    expect(manual.suppressedScheduleIds).not.toContain('feishi-1400');
  });

  it('drops unknown task ids and safely falls back for invalid snapshots', () => {
    const role = account('kian');
    const normalized = normalizeWorkbenchTaskSnapshot({
      schemaVersion: 1,
      accountId: 'kian',
      dateKey: '2026-08-14',
      tasks: {
        'priority:kian-sla': { status: 'in_progress', focused: true },
        'priority:unknown': { status: 'completed', focused: false },
      },
      suppressedScheduleIds: ['kian-1030', 'unknown'],
    }, role, '2026-08-14');
    const wrongDate = normalizeWorkbenchTaskSnapshot({ ...normalized, dateKey: '2026-08-13' }, role, '2026-08-14');

    expect(normalized.tasks['priority:kian-sla'].status).toBe('in_progress');
    expect(normalized.tasks['priority:unknown']).toBeUndefined();
    expect(normalized.suppressedScheduleIds).toEqual(['kian-1030']);
    expect(wrongDate).toEqual(createInitialWorkbenchTaskSnapshot(role, '2026-08-14'));
  });
});
