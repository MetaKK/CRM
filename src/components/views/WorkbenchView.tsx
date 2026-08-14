import React, { useEffect, useRef, useState } from 'react';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, ChevronDown, ChevronRight, GripVertical, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { mockClients } from '../../data/mockData';
import { getWorkbenchTaskState } from '../../lib/workbenchTasks';
import {
  AppTool,
  ClientRecord,
  OperatingDemoSnapshot,
  OperatingPeriod,
  RoleAccount,
  TabType,
  WorkbenchInsightPeriod,
  WorkbenchOperatingMetric,
  WorkbenchPriority,
  WorkbenchScheduleItem,
  WorkbenchSectionId,
  WorkbenchTaskReference,
  WorkbenchTaskSnapshot,
} from '../../types';
import { formatOperatingValue, getInsightPresentation, getOperatingMetricValue, operatingPeriodLabels } from '../../lib/operatingDemo';
import { getAppToolIcon } from '../appTools';

interface WorkbenchViewProps {
  onNavigateToTab: (tab: TabType) => void;
  onOpenAppCenter: () => void;
  onSelectClient: (client: ClientRecord) => void;
  onOpenQuoteBuilder: (client: ClientRecord) => void;
  onLaunchTool: (tool: AppTool) => void;
  onSectionOrderChange: (sectionOrder: WorkbenchSectionId[]) => void;
  onPromoteSchedule: (item: WorkbenchScheduleItem, source: 'ai' | 'manual', mode?: 'manual' | 'automatic') => void;
  onUnpinSchedule: (item: WorkbenchScheduleItem) => void;
  onTaskStarted: (reference: WorkbenchTaskReference, stage: 'priority' | 'schedule') => void;
  onTaskCompleted: (reference: WorkbenchTaskReference, stage: 'priority' | 'schedule') => void;
  onTaskReopened: (reference: WorkbenchTaskReference) => void;
  onAutoPromoteEnabledChange: (enabled: boolean) => void;
  onPriorityOpened?: (isTransferred: boolean) => void;
  onScheduleOpened?: () => void;
  onRecommendationShown?: (mode: 'manual' | 'automatic') => void;
  onRecommendationAccepted?: () => void;
  currentAccount: RoleAccount;
  priorities: WorkbenchPriority[];
  tools: AppTool[];
  quickToolIds: string[];
  sectionOrder: WorkbenchSectionId[];
  autoPromoteEnabled: boolean;
  autoPromotionPaused: boolean;
  taskSnapshot: WorkbenchTaskSnapshot;
  operatingPeriod: OperatingPeriod;
  operatingSnapshot: OperatingDemoSnapshot;
  onOperatingPeriodChange: (period: OperatingPeriod) => void;
  onOperatingMetricOpen: (metric: WorkbenchOperatingMetric, period: OperatingPeriod) => void;
  onOperatingOverviewOpen: (period: OperatingPeriod) => void;
  onOperatingInsightOpen: (insight: WorkbenchInsightPeriod & { resolved: boolean }, period: OperatingPeriod) => void;
}

type FocusTab = 'priority' | 'schedule';

const urgencyTone: Record<WorkbenchPriority['urgency'], { dot: string; label: string; text: string }> = {
  critical: { dot: 'bg-[#e84040]', label: '需立即处理', text: 'text-[#d63b3b]' },
  high: { dot: 'bg-[#f0a800]', label: '高优先级', text: 'text-[#b77900]' },
  medium: { dot: 'bg-[#1a6fd4]', label: '重点推进', text: 'text-[#1a6fd4]' },
  normal: { dot: 'bg-emerald-500', label: '计划事项', text: 'text-emerald-700' },
};

const urgencyWeight: Record<WorkbenchPriority['urgency'], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  normal: 1,
};

const sectionLabels: Record<WorkbenchSectionId, string> = {
  focus: '最紧急的事与今日行程',
  pulse: '经营概览',
  tools: '工作必备',
};

const isSectionId = (value: string | undefined): value is WorkbenchSectionId =>
  value === 'focus' || value === 'pulse' || value === 'tools';

const timeValue = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : Number.MAX_SAFE_INTEGER;
};

interface SortableWorkbenchPanelProps {
  id: WorkbenchSectionId;
  children: React.ReactNode;
}

const SortableWorkbenchPanel: React.FC<SortableWorkbenchPanelProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      data-workbench-section-id={id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
      }}
      className={`relative ${isDragging ? 'scale-[0.985] opacity-85' : ''}`}
    >
      <div className={isDragging ? 'pointer-events-none' : undefined}>{children}</div>
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`拖动以调整${sectionLabels[id]}的位置`}
        className="absolute right-2 top-2 z-20 flex h-11 w-11 touch-none items-center justify-center rounded-lg text-[#aab8cd] transition-colors hover:bg-[#f3f8fe] hover:text-[#1a6fd4] focus-visible:bg-[#f3f8fe] focus-visible:text-[#1a6fd4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a6fd4] focus-visible:ring-offset-2 cursor-grab active:bg-blue-50 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  );
};

export const WorkbenchView: React.FC<WorkbenchViewProps> = ({
  onNavigateToTab,
  onOpenAppCenter,
  onSelectClient,
  onOpenQuoteBuilder,
  onLaunchTool,
  onSectionOrderChange,
  onPromoteSchedule,
  onUnpinSchedule,
  onTaskStarted,
  onTaskCompleted,
  onTaskReopened,
  onAutoPromoteEnabledChange,
  onPriorityOpened,
  onScheduleOpened,
  onRecommendationShown,
  onRecommendationAccepted,
  currentAccount,
  priorities,
  tools,
  quickToolIds,
  sectionOrder,
  autoPromoteEnabled,
  autoPromotionPaused,
  taskSnapshot,
  operatingPeriod,
  operatingSnapshot,
  onOperatingPeriodChange,
  onOperatingMetricOpen,
  onOperatingOverviewOpen,
  onOperatingInsightOpen,
}) => {
  const [focusTab, setFocusTab] = useState<FocusTab>('priority');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [isPriorityExpanded, setIsPriorityExpanded] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const aiTimerRef = useRef<number | null>(null);
  const shownRecommendationRef = useRef<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
    aiTimerRef.current = null;
    shownRecommendationRef.current = null;
    setFocusTab('priority');
    setIsAiAnalyzing(false);
    setIsPriorityExpanded(false);
    setIsCompletedExpanded(false);
  }, [currentAccount.id]);

  useEffect(() => () => {
    if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
  }, []);

  const getClient = (clientId?: string) => mockClients.find((client) => client.id === clientId);

  const getPriorityReference = (priority: WorkbenchPriority): WorkbenchTaskReference => priority.sourceScheduleId
    ? { kind: 'schedule', id: priority.sourceScheduleId }
    : { kind: 'priority', id: priority.id };

  const handlePriorityAction = (priority: WorkbenchPriority) => {
    onTaskStarted(getPriorityReference(priority), 'priority');
    onPriorityOpened?.(Boolean(priority.source));
    const client = getClient(priority.clientId);
    if (priority.interaction === 'quote' && client) {
      onOpenQuoteBuilder(client);
      return;
    }
    if (priority.interaction === 'client' && client) {
      onSelectClient(client);
      return;
    }
    if (priority.targetTab) onNavigateToTab(priority.targetTab);
  };

  const handleScheduleAction = (item: WorkbenchScheduleItem) => {
    onTaskStarted({ kind: 'schedule', id: item.id }, 'schedule');
    onScheduleOpened?.();
    const client = getClient(item.clientId);
    if (client && item.targetTab === 'clients') {
      onSelectClient(client);
      return;
    }
    if (item.targetTab) onNavigateToTab(item.targetTab);
  };

  const scheduleWithState = currentAccount.workbenchSchedule.map((item) => ({
    item,
    state: getWorkbenchTaskState(taskSnapshot, { kind: 'schedule', id: item.id }),
  }));
  const activeSchedule = scheduleWithState.filter(({ state }) => state.status !== 'completed').map(({ item }) => item);
  const completedSchedule = scheduleWithState.filter(({ state }) => state.status === 'completed').map(({ item }) => item);
  const displayedPriorities = isPriorityExpanded ? priorities : priorities.slice(0, 3);
  const primaryPriority = displayedPriorities[0];
  const followingPriorities = displayedPriorities.slice(1);
  const promotedScheduleIds = new Set(
    priorities.flatMap((priority) => priority.sourceScheduleId ? [priority.sourceScheduleId] : []),
  );
  const aiCandidate = [...activeSchedule]
    .filter((item) => !promotedScheduleIds.has(item.id) && !taskSnapshot.suppressedScheduleIds.includes(item.id))
    .sort((first, second) => (
      urgencyWeight[second.urgency] - urgencyWeight[first.urgency]
      || Number(Boolean(second.clientId)) - Number(Boolean(first.clientId))
      || timeValue(first.time) - timeValue(second.time)
    ))[0];
  const primaryToolClient = getClient(primaryPriority?.clientId) || mockClients[0];
  const quickTools = quickToolIds
    .map((toolId) => tools.find((tool) => tool.id === toolId))
    .filter((tool): tool is AppTool => Boolean(tool));

  const handleToolLaunch = (tool: AppTool) => {
    if (tool.action === 'quote') {
      onOpenQuoteBuilder(primaryToolClient);
      return;
    }
    onLaunchTool(tool);
  };

  const handleAiPromotion = () => {
    if (!aiCandidate || isAiAnalyzing) return;
    setIsAiAnalyzing(true);
    aiTimerRef.current = window.setTimeout(() => {
      onRecommendationAccepted?.();
      onPromoteSchedule(aiCandidate, 'ai', 'manual');
      setFocusTab('priority');
      setIsAiAnalyzing(false);
      aiTimerRef.current = null;
    }, 680);
  };

  useEffect(() => {
    if (!autoPromoteEnabled || autoPromotionPaused || primaryPriority || !aiCandidate) {
      if (aiTimerRef.current !== null) {
        window.clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
      if (isAiAnalyzing) setIsAiAnalyzing(false);
      return;
    }

    if (isAiAnalyzing || aiTimerRef.current !== null) return;

    const candidate = aiCandidate;
    setIsAiAnalyzing(true);
    aiTimerRef.current = window.setTimeout(() => {
      onPromoteSchedule(candidate, 'ai', 'automatic');
      setFocusTab('priority');
      setIsAiAnalyzing(false);
      aiTimerRef.current = null;
    }, 900);
  }, [aiCandidate, autoPromoteEnabled, autoPromotionPaused, isAiAnalyzing, onPromoteSchedule, primaryPriority]);

  useEffect(() => {
    if (autoPromotionPaused || primaryPriority || !aiCandidate) return;
    const recommendationKey = `${aiCandidate.id}:${autoPromoteEnabled ? 'automatic' : 'manual'}`;
    if (shownRecommendationRef.current === recommendationKey) return;
    shownRecommendationRef.current = recommendationKey;
    onRecommendationShown?.(autoPromoteEnabled ? 'automatic' : 'manual');
  }, [aiCandidate, autoPromoteEnabled, autoPromotionPaused, onRecommendationShown, primaryPriority]);

  const handleManualPromotion = (item: WorkbenchScheduleItem) => {
    if (promotedScheduleIds.has(item.id)) {
      onUnpinSchedule(item);
      return;
    }
    onPromoteSchedule(item, 'manual');
    setFocusTab('priority');
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (!isSectionId(activeId) || !isSectionId(overId) || activeId === overId) return;

    const sourceIndex = sectionOrder.indexOf(activeId);
    const targetIndex = sectionOrder.indexOf(overId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    onSectionOrderChange(arrayMove(sectionOrder, sourceIndex, targetIndex) as WorkbenchSectionId[]);
  };

  const renderPriorityContent = () => {
    if (!primaryPriority) {
      const allScheduleComplete = activeSchedule.length === 0;
      return (
        <div className="border-t border-[#f0f3f9] px-4 py-4">
          <div className="rounded-xl border border-[#dce9f7] bg-[#f8fbff] p-3.5">
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1a6fd4]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <strong className="block text-[13px] text-slate-800">紧急事项已处理完</strong>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5a6a88]">
                  可以从今日行程选择下一件，开启自动置顶后系统会自动推荐。
                </p>
              </div>
            </div>

            {currentAccount.workbenchAutoPromoteUseCase && (
              <p className="mt-3 border-l-2 border-[#b9d7f3] pl-2.5 text-[10px] leading-relaxed text-[#5a6a88]">
                演示场景：{currentAccount.workbenchAutoPromoteUseCase.replace('自动推荐', '自动置顶')}
              </p>
            )}

            {isAiAnalyzing ? (
              <div role="status" className="mt-3 flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-[11px] text-[#1a6fd4]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a6fd4] animate-pulse" />
                正在选择下一件：优先级 → 时效 → 客户影响
              </div>
            ) : aiCandidate && !autoPromoteEnabled ? (
              <button
                onClick={handleAiPromotion}
                className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#1a6fd4] px-3 text-[11px] font-semibold text-white transition-colors hover:bg-[#155caf] cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                帮我选下一件
              </button>
            ) : aiCandidate && autoPromotionPaused ? (
              <p className="mt-3 text-center text-[11px] text-[#5a6a88]">完成操作可撤销，确认后将自动置顶下一件</p>
            ) : aiCandidate ? (
              <p className="mt-3 text-center text-[11px] text-[#5a6a88]">已开启自动置顶，即将选择下一件</p>
            ) : (
              <p className="mt-3 rounded-lg bg-white px-3 py-2.5 text-[11px] text-[#8a9ab8]">
                {allScheduleComplete ? '今日行程已全部完成' : '暂无可自动置顶事项，可在今日行程中手工选择'}
              </p>
            )}
          </div>
        </div>
      );
    }

    const primaryTone = urgencyTone[primaryPriority.urgency];
    const primaryReference = getPriorityReference(primaryPriority);
    const primaryState = getWorkbenchTaskState(taskSnapshot, primaryReference);
    return (
      <div className="divide-y divide-[#f0f3f9] border-t border-[#f0f3f9]">
        <div className="flex gap-3 px-4 py-3.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1a6fd4] text-[11px] font-bold text-white">1</span>
          <button onClick={() => handlePriorityAction(primaryPriority)} className="min-w-0 flex-1 text-left cursor-pointer">
            <span className={`flex flex-wrap items-center gap-1.5 text-[11px] font-medium ${primaryTone.text}`}>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${primaryTone.dot}`} />
              {primaryTone.label}
              {primaryPriority.source && (
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-[#1a6fd4]">
                  {primaryPriority.source === 'ai' ? '智能置顶' : '手工置顶'}
                </span>
              )}
              {primaryState.status === 'in_progress' && (
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">处理中</span>
              )}
            </span>
            <strong className="mt-1 block truncate text-[14px] text-slate-900">{primaryPriority.subject}</strong>
            <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">{primaryPriority.title} · {primaryPriority.description}</span>
          </button>
          <div className="flex shrink-0 flex-col items-end justify-between gap-2">
            <span className="text-[10px] text-slate-400">{primaryPriority.dueLabel}</span>
            <button onClick={() => handlePriorityAction(primaryPriority)} className="rounded-lg bg-[#1a6fd4] px-2.5 py-1.5 text-[11px] font-semibold text-white cursor-pointer transition-colors hover:bg-[#155caf]">
              {primaryState.status === 'in_progress' ? '继续处理' : primaryPriority.actionLabel}
            </button>
            {primaryState.status === 'in_progress' && (
              <button
                type="button"
                onClick={() => onTaskCompleted(primaryReference, 'priority')}
                className="flex min-h-7 items-center gap-1 text-[10px] font-semibold text-[#1a6fd4] cursor-pointer"
              >
                <Check className="h-3 w-3" />标记已处理
              </button>
            )}
          </div>
        </div>

        {followingPriorities.map((priority, index) => {
          const tone = urgencyTone[priority.urgency];
          const reference = getPriorityReference(priority);
          const state = getWorkbenchTaskState(taskSnapshot, reference);
          return (
            <div key={priority.id} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-blue-50/40">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-[#1a6fd4]">{index + 2}</span>
              <button onClick={() => handlePriorityAction(priority)} className="min-w-0 flex-1 text-left cursor-pointer">
                <span className={`flex flex-wrap items-center gap-1.5 text-[10px] font-medium ${tone.text}`}>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
                  {tone.label}
                  {priority.source && <span className="text-[#1a6fd4]">{priority.source === 'ai' ? '智能置顶' : '手工置顶'}</span>}
                  {state.status === 'in_progress' && <span className="text-emerald-700">处理中</span>}
                </span>
                <strong className="mt-0.5 block truncate text-[13px] text-slate-800">{priority.subject}</strong>
              </button>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <button onClick={() => handlePriorityAction(priority)} className="flex min-h-7 items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                  {state.status === 'in_progress' ? '继续处理' : priority.dueLabel}<ChevronRight className="h-3.5 w-3.5 text-[#1a6fd4]" />
                </button>
                {state.status === 'in_progress' && (
                  <button onClick={() => onTaskCompleted(reference, 'priority')} className="min-h-7 text-[10px] font-semibold text-[#1a6fd4] cursor-pointer">标记已处理</button>
                )}
              </div>
            </div>
          );
        })}

        {priorities.length > 3 && (
          <button
            type="button"
            aria-expanded={isPriorityExpanded}
            onClick={() => setIsPriorityExpanded((expanded) => !expanded)}
            className="flex min-h-10 w-full items-center justify-center gap-1 text-[11px] font-medium text-[#1a6fd4] cursor-pointer"
          >
            {isPriorityExpanded ? '收起' : `展开其余 ${priorities.length - 3} 件`}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isPriorityExpanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
    );
  };

  const renderScheduleContent = () => {
    const total = currentAccount.workbenchSchedule.length;
    const completed = completedSchedule.length;
    const progress = total ? Math.round((completed / total) * 100) : 0;

    return (
      <div className="border-t border-[#f0f3f9] px-5">
        {activeSchedule.length === 0 ? (
          <p className="py-5 text-center text-[12px] text-[#8a9ab8]">今日行程已全部完成</p>
        ) : activeSchedule.map((item) => {
          const tone = urgencyTone[item.urgency];
          const reference: WorkbenchTaskReference = { kind: 'schedule', id: item.id };
          const state = getWorkbenchTaskState(taskSnapshot, reference);
          const isPromoted = promotedScheduleIds.has(item.id);
          return (
            <div key={item.id} className="flex gap-3 border-t border-[#f0f3f9] py-3">
              <button onClick={() => handleScheduleAction(item)} className="flex min-w-0 flex-1 items-start gap-3 text-left cursor-pointer">
                <span className="w-9 shrink-0 pt-0.5 text-[13px] font-bold text-slate-800">{item.time}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
                    <strong className="truncate text-[13px] text-slate-800">{item.title}</strong>
                  </span>
                  <span className="mt-1 block truncate text-[12px] text-slate-600">{item.subject}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-slate-400">{item.description}</span>
                </span>
              </button>
              <div className="flex shrink-0 flex-col items-end gap-1 py-0.5">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${state.status === 'in_progress' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#1a6fd4]'}`}>
                  {state.status === 'in_progress' ? '处理中' : item.status}
                </span>
                <button
                  onClick={() => handleManualPromotion(item)}
                  className="min-h-7 text-[10px] font-medium text-[#1a6fd4] cursor-pointer"
                >
                  {isPromoted ? '取消置顶' : '置顶处理'}
                </button>
                {state.status === 'in_progress' && (
                  <button onClick={() => onTaskCompleted(reference, 'schedule')} className="min-h-7 text-[10px] font-semibold text-[#1a6fd4] cursor-pointer">标记已处理</button>
                )}
              </div>
            </div>
          );
        })}

        {completedSchedule.length > 0 && (
          <div className="border-t border-[#f0f3f9]">
            <button
              type="button"
              aria-expanded={isCompletedExpanded}
              onClick={() => setIsCompletedExpanded((expanded) => !expanded)}
              className="flex min-h-11 w-full items-center justify-between text-[11px] font-medium text-[#5a6a88] cursor-pointer"
            >
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-600" />已完成 {completedSchedule.length} 件</span>
              <span className="flex items-center gap-2">
                <span
                  role="progressbar"
                  aria-label={`今日行程已完成 ${completed} 件，共 ${total} 件`}
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={completed}
                  className="h-1 w-10 overflow-hidden rounded-full bg-[#eaf0f7]"
                >
                  <span
                    className="block h-full rounded-full bg-[#8fb7e7] transition-[width] duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </span>
                <ChevronDown className={`h-4 w-4 text-[#8a9ab8] transition-transform ${isCompletedExpanded ? 'rotate-180' : ''}`} />
              </span>
            </button>
            {isCompletedExpanded && completedSchedule.map((item) => (
              <div key={item.id} className="flex items-center gap-3 border-t border-[#f0f3f9] py-2.5">
                <span className="w-9 shrink-0 text-[12px] font-medium text-[#8a9ab8]">{item.time}</span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-[12px] font-medium text-[#5a6a88] line-through decoration-[#aab8cd]">{item.title}</strong>
                  <span className="mt-0.5 block truncate text-[10px] text-[#aab8cd]">{item.subject}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onTaskReopened({ kind: 'schedule', id: item.id })}
                  className="flex min-h-8 items-center gap-1 text-[10px] font-semibold text-[#1a6fd4] cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />恢复
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderFocus = () => (
    <section className="crm-card overflow-hidden">
      <div className="px-5 pr-16 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium text-[#1a6fd4]">{currentAccount.roleTitle}</p>
          <button
            type="button"
            role="switch"
            aria-checked={autoPromoteEnabled}
            aria-label="自动置顶：紧急事项为空时，从今日行程选择下一件并置顶"
            onClick={() => onAutoPromoteEnabledChange(!autoPromoteEnabled)}
            className="flex h-7 shrink-0 items-center gap-1.5 text-[10px] font-medium text-[#5a6a88] cursor-pointer"
          >
            自动置顶
            <span className={`relative h-4 w-7 rounded-full transition-colors ${autoPromoteEnabled ? 'bg-[#1a6fd4]' : 'bg-[#c7d2e2]'}`}>
              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-[left,right] ${autoPromoteEnabled ? 'right-0.5' : 'left-0.5'}`} />
            </span>
          </button>
        </div>
        <div className="mt-1.5 flex items-end gap-5 border-b border-[#f0f3f9]" role="tablist" aria-label="关键行动">
          <button
            role="tab"
            aria-selected={focusTab === 'priority'}
            onClick={() => setFocusTab('priority')}
            className={`relative h-8 border-b-2 text-[14px] font-semibold transition-colors cursor-pointer ${focusTab === 'priority' ? 'border-[#1a6fd4] text-slate-900' : 'border-transparent text-[#8a9ab8] hover:text-[#5a6a88]'}`}
          >
            最紧急{priorities.length > 0 ? ` · ${priorities.length}` : ''}
          </button>
          <button
            role="tab"
            aria-selected={focusTab === 'schedule'}
            onClick={() => setFocusTab('schedule')}
            className={`relative h-8 border-b-2 text-[14px] font-semibold transition-colors cursor-pointer ${focusTab === 'schedule' ? 'border-[#1a6fd4] text-slate-900' : 'border-transparent text-[#8a9ab8] hover:text-[#5a6a88]'}`}
          >
            今日行程{currentAccount.workbenchSchedule.length > 0 ? ` · 待办 ${activeSchedule.length}` : ''}
          </button>
        </div>
      </div>
      {focusTab === 'priority' ? renderPriorityContent() : renderScheduleContent()}
    </section>
  );

  const renderPulse = () => {
    const metrics = currentAccount.workbenchMetrics.filter((metric) => metric.primary).slice(0, 2);
    const insight = getInsightPresentation(currentAccount, operatingPeriod, operatingSnapshot);
    return (
      <section className="crm-card overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 pr-16 pt-4 pb-3">
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-slate-900">经营概览</h2>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">{operatingPeriodLabels[operatingPeriod]}关键结果与待处理信号</p>
          </div>
          <label className="relative mt-0.5 shrink-0">
            <span className="sr-only">经营数据时间范围</span>
            <select
              value={operatingPeriod}
              onChange={(event) => onOperatingPeriodChange(event.target.value as OperatingPeriod)}
              className="h-8 appearance-none rounded-lg border border-[#dce6f1] bg-white pl-2.5 pr-7 text-[10px] font-semibold text-[#5a6a88] cursor-pointer"
            >
              <option value="today">今日</option>
              <option value="seven_days">近 7 天</option>
              <option value="month">本月</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-2 h-3.5 w-3.5 text-[#8a9ab8]" />
          </label>
        </div>

        <div className="grid grid-cols-2 divide-x divide-[#eaf0f7] border-t border-[#eaf0f7] px-3 py-4">
          {metrics.map((metric) => {
            const value = getOperatingMetricValue(metric, operatingPeriod, operatingSnapshot);
            return (
              <button
                key={metric.id}
                type="button"
                onClick={() => onOperatingMetricOpen(metric, operatingPeriod)}
                aria-label={`查看${operatingPeriodLabels[operatingPeriod]}${metric.label}明细`}
                className="group min-w-0 px-2 text-center cursor-pointer active:scale-[0.98] transition-transform"
              >
                <span className="flex items-center justify-center gap-0.5 truncate text-[11px] text-slate-400 group-hover:text-[#1a6fd4]">
                  {metric.label}<ChevronRight className="h-3 w-3 shrink-0" />
                </span>
                <span className="mt-1.5 flex items-baseline justify-center gap-1">
                  <strong className="truncate text-[22px] leading-none font-bold text-slate-900">{formatOperatingValue(value)}</strong>
                  {metric.unit && <span className="text-[10px] text-[#8a9ab8]">{metric.unit}</span>}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onOperatingOverviewOpen(operatingPeriod)}
          className="flex min-h-10 w-full items-center justify-center gap-1 border-t border-[#eaf0f7] bg-white text-[11px] font-medium text-[#5a6a88] cursor-pointer hover:text-[#1a6fd4]"
        >
          查看全部经营数据<ChevronRight className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onOperatingInsightOpen(insight, operatingPeriod)}
          className="flex w-full items-start gap-3 border-t border-[#eaf0f7] bg-[#f8fbff] px-5 py-3.5 text-left cursor-pointer hover:bg-blue-50/50"
        >
          <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${insight.resolved ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-[#1a6fd4]'}`}>
            {insight.resolved ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-medium text-[#1a6fd4]">{currentAccount.workbenchInsight.eyebrow}</span>
            <strong className="mt-0.5 block text-[12px] leading-snug text-slate-800">{insight.title}</strong>
            <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">{insight.description}</span>
          </span>
          <span className="flex max-w-[112px] shrink-0 items-center self-center whitespace-nowrap text-right text-[11px] font-medium leading-snug text-[#1a6fd4]">
            {insight.actionLabel}<ChevronRight className="h-3.5 w-3.5 shrink-0" />
          </span>
        </button>
      </section>
    );
  };

  const renderTools = () => (
    <section className="crm-card">
      <div className="px-5 pr-16 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[16px] font-bold text-slate-900">工作必备</h2>
            <p className="mt-0.5 text-[11px] text-slate-400">{quickTools.length > 4 ? `已添加 ${quickTools.length} 个高频动作，左右滑动查看` : '来自应用中心，仅保留当前角色的高频动作'}</p>
          </div>
          <button
            type="button"
            onClick={onOpenAppCenter}
            className="mt-0.5 shrink-0 text-[11px] font-semibold text-[#1a6fd4] cursor-pointer"
          >
            管理
          </button>
        </div>
      </div>
      <div className="border-t border-[#f0f3f9]">
        <div
          className="flex snap-x snap-proximity gap-1 overflow-x-auto px-2 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="工作必备，左右滑动查看更多应用"
        >
        {quickTools.map((tool) => {
          const Icon = getAppToolIcon(tool.iconName);
          return (
            <button key={tool.id} onClick={() => handleToolLaunch(tool)} className="flex w-[72px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-xl py-1.5 cursor-pointer hover:bg-blue-50/60">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1a6fd4]"><Icon className="h-5 w-5" /></span>
              <span className="max-w-[68px] truncate text-[11px] font-medium text-slate-700">{tool.quickLabel}</span>
            </button>
          );
        })}
          <button type="button" onClick={onOpenAppCenter} className="flex w-[72px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-xl py-1.5 cursor-pointer hover:bg-blue-50/60">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-[#b9d0ee] bg-[#f8fbff] text-[#1a6fd4]"><Plus className="h-5 w-5" /></span>
            <span className="text-[11px] font-medium text-[#5a6a88]">添加应用</span>
          </button>
        </div>
      </div>
    </section>
  );

  const panels: Record<WorkbenchSectionId, React.ReactNode> = {
    focus: renderFocus(),
    pulse: renderPulse(),
    tools: renderTools(),
  };

  return (
    <main className="crm-page select-none" aria-label="工作台">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-3.5">
            {sectionOrder.map((sectionId) => (
              <SortableWorkbenchPanel key={sectionId} id={sectionId}>
                {panels[sectionId]}
              </SortableWorkbenchPanel>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </main>
  );
};
