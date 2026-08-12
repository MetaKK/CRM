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
import { ChevronRight, GripVertical, Plus, Sparkles } from 'lucide-react';
import { mockClients } from '../../data/mockData';
import {
  AppTool,
  ClientRecord,
  RoleAccount,
  TabType,
  WorkbenchPriority,
  WorkbenchScheduleItem,
  WorkbenchSectionId,
} from '../../types';
import { getAppToolIcon } from '../appTools';

interface WorkbenchViewProps {
  onNavigateToTab: (tab: TabType) => void;
  onOpenAppCenter: () => void;
  onSelectClient: (client: ClientRecord) => void;
  onOpenQuoteBuilder: (client: ClientRecord) => void;
  onLaunchTool: (tool: AppTool) => void;
  onSectionOrderChange: (sectionOrder: WorkbenchSectionId[]) => void;
  onPromoteSchedule: (item: WorkbenchScheduleItem, source: 'ai' | 'manual') => void;
  onAutoPromoteEnabledChange: (enabled: boolean) => void;
  currentAccount: RoleAccount;
  priorities: WorkbenchPriority[];
  tools: AppTool[];
  quickToolIds: string[];
  sectionOrder: WorkbenchSectionId[];
  autoPromoteEnabled: boolean;
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
  onAutoPromoteEnabledChange,
  currentAccount,
  priorities,
  tools,
  quickToolIds,
  sectionOrder,
  autoPromoteEnabled,
}) => {
  const [focusTab, setFocusTab] = useState<FocusTab>('priority');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const aiTimerRef = useRef<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
    aiTimerRef.current = null;
    setFocusTab('priority');
    setIsAiAnalyzing(false);
  }, [currentAccount.id]);

  useEffect(() => () => {
    if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
  }, []);

  const getClient = (clientId?: string) => mockClients.find((client) => client.id === clientId);

  const handlePriorityAction = (priority: WorkbenchPriority) => {
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
    const client = getClient(item.clientId);
    if (client && item.targetTab === 'clients') {
      onSelectClient(client);
      return;
    }
    if (item.targetTab) onNavigateToTab(item.targetTab);
  };

  const activeSchedule = currentAccount.workbenchSchedule.filter((item) => item.status !== '已完成');
  const displayedPriorities = priorities.slice(0, 3);
  const primaryPriority = displayedPriorities[0];
  const followingPriorities = displayedPriorities.slice(1);
  const promotedScheduleIds = new Set(
    priorities.flatMap((priority) => priority.sourceScheduleId ? [priority.sourceScheduleId] : []),
  );
  const aiCandidate = [...activeSchedule]
    .filter((item) => !promotedScheduleIds.has(item.id))
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
      onPromoteSchedule(aiCandidate, 'ai');
      setFocusTab('priority');
      setIsAiAnalyzing(false);
      aiTimerRef.current = null;
    }, 680);
  };

  useEffect(() => {
    if (!autoPromoteEnabled || primaryPriority || !aiCandidate) {
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
      onPromoteSchedule(candidate, 'ai');
      setFocusTab('priority');
      setIsAiAnalyzing(false);
      aiTimerRef.current = null;
    }, 1100);
  }, [aiCandidate, autoPromoteEnabled, isAiAnalyzing, onPromoteSchedule, primaryPriority]);

  const handleManualPromotion = (item: WorkbenchScheduleItem) => {
    if (promotedScheduleIds.has(item.id)) return;
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
      return (
        <div className="border-t border-[#f0f3f9] px-4 py-4">
          <div className="rounded-xl border border-[#dce9f7] bg-[#f8fbff] p-3.5">
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1a6fd4]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <strong className="block text-[13px] text-slate-800">{currentAccount.workbenchEmptyStateTitle || '最紧急事项已清空'}</strong>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5a6a88]">{currentAccount.workbenchEmptyStateDescription || '可从今日行程补充下一件最值得优先推进的事情。'}</p>
              </div>
            </div>

            {currentAccount.workbenchAutoPromoteUseCase && (
              <p className="mt-3 border-l-2 border-[#b9d7f3] pl-2.5 text-[10px] leading-relaxed text-[#5a6a88]">
                当前场景：{currentAccount.workbenchAutoPromoteUseCase}
              </p>
            )}

            {isAiAnalyzing ? (
              <div role="status" className="mt-3 flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-[11px] text-[#1a6fd4]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a6fd4] animate-pulse" />
                正在评估下一件：优先级 → 时效 → 客户影响
              </div>
            ) : aiCandidate && !autoPromoteEnabled ? (
              <button
                onClick={handleAiPromotion}
                className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#1a6fd4] px-3 text-[11px] font-semibold text-white transition-colors hover:bg-[#155caf] cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                推荐下一件
              </button>
            ) : aiCandidate ? (
              <p className="mt-3 text-center text-[11px] text-[#5a6a88]">已开启自动转入，将从今日行程推荐下一件</p>
            ) : (
              <p className="mt-3 rounded-lg bg-white px-3 py-2.5 text-[11px] text-[#8a9ab8]">今日行程暂无可转入的待办事项</p>
            )}
          </div>
        </div>
      );
    }

    const primaryTone = urgencyTone[primaryPriority.urgency];
    return (
      <div className="divide-y divide-[#f0f3f9] border-t border-[#f0f3f9]">
        <div className="flex gap-3 px-4 py-3.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1a6fd4] text-[11px] font-bold text-white">1</span>
          <button onClick={() => handlePriorityAction(primaryPriority)} className="min-w-0 flex-1 text-left cursor-pointer">
            <span className={`flex items-center gap-1.5 text-[11px] font-medium ${primaryTone.text}`}>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${primaryTone.dot}`} />
              {primaryTone.label}
              {primaryPriority.source && (
                <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-[#1a6fd4]">
                  {primaryPriority.source === 'ai' ? 'AI 转入' : '手工置顶'}
                </span>
              )}
            </span>
            <strong className="mt-1 block truncate text-[14px] text-slate-900">{primaryPriority.subject}</strong>
            <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">{primaryPriority.title} · {primaryPriority.description}</span>
          </button>
          <div className="flex shrink-0 flex-col items-end justify-between gap-2">
            <span className="text-[10px] text-slate-400">{primaryPriority.dueLabel}</span>
            <button onClick={() => handlePriorityAction(primaryPriority)} className="rounded-lg bg-[#1a6fd4] px-2.5 py-1.5 text-[11px] font-semibold text-white cursor-pointer transition-colors hover:bg-[#155caf]">
              {primaryPriority.actionLabel}
            </button>
          </div>
        </div>

        {followingPriorities.map((priority, index) => {
          const tone = urgencyTone[priority.urgency];
          return (
            <button key={priority.id} onClick={() => handlePriorityAction(priority)} className="flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-blue-50/40">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-[#1a6fd4]">{index + 2}</span>
              <span className="min-w-0 flex-1">
                <span className={`flex items-center gap-1.5 text-[10px] font-medium ${tone.text}`}>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
                  {tone.label}
                  {priority.source && <span className="text-[#1a6fd4]">{priority.source === 'ai' ? 'AI 转入' : '手工置顶'}</span>}
                </span>
                <strong className="mt-0.5 block truncate text-[13px] text-slate-800">{priority.subject}</strong>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[10px] text-slate-400">{priority.dueLabel}<ChevronRight className="h-3.5 w-3.5 text-[#1a6fd4]" /></span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderScheduleContent = () => (
    <div className="border-t border-[#f0f3f9] px-5">
      {activeSchedule.length === 0 ? (
        <p className="py-5 text-center text-[12px] text-[#8a9ab8]">今日行程已全部完成</p>
      ) : activeSchedule.map((item) => {
        const tone = urgencyTone[item.urgency];
        const isPromoted = promotedScheduleIds.has(item.id);
        return (
          <div key={item.id} className="flex gap-3 border-b border-[#f0f3f9] py-3 last:border-0">
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
            <div className="flex shrink-0 flex-col items-end justify-between gap-2 py-0.5">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-[#1a6fd4]">{item.status}</span>
              <button
                onClick={() => handleManualPromotion(item)}
                disabled={isPromoted}
                className="text-[10px] font-medium text-[#1a6fd4] cursor-pointer disabled:cursor-default disabled:text-[#aab8cd]"
              >
                {isPromoted ? '已转入' : '设为最紧急'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderFocus = () => (
    <section className="crm-card overflow-hidden">
      <div className="px-5 pr-16 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium text-[#1a6fd4]">{currentAccount.roleTitle}</p>
          <button
            type="button"
            role="switch"
            aria-checked={autoPromoteEnabled}
            aria-label="自动转入：紧急事项为空时，将今日行程推荐事项转入最紧急的事"
            onClick={() => onAutoPromoteEnabledChange(!autoPromoteEnabled)}
            className="flex h-7 shrink-0 items-center gap-1.5 text-[10px] font-medium text-[#5a6a88] cursor-pointer"
          >
            自动转入
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
            最紧急的事
          </button>
          <button
            role="tab"
            aria-selected={focusTab === 'schedule'}
            onClick={() => setFocusTab('schedule')}
            className={`relative h-8 border-b-2 text-[14px] font-semibold transition-colors cursor-pointer ${focusTab === 'schedule' ? 'border-[#1a6fd4] text-slate-900' : 'border-transparent text-[#8a9ab8] hover:text-[#5a6a88]'}`}
          >
            今日行程{activeSchedule.length > 0 ? ` · ${activeSchedule.length}` : ''}
          </button>
        </div>
      </div>
      {focusTab === 'priority' ? renderPriorityContent() : renderScheduleContent()}
    </section>
  );

  const renderPulse = () => (
    <section className="crm-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pr-16 pt-4">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">经营概览</h2>
          <p className="mt-0.5 text-[11px] text-slate-400">两个结果指标，加一条最需要决策的经营信号</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 border-t border-[#f0f3f9] px-4 py-4">
        {currentAccount.workbenchMetrics.slice(0, 2).map((metric) => (
          <button
            key={metric.label}
            onClick={() => metric.targetTab && onNavigateToTab(metric.targetTab)}
            className="min-w-0 text-center cursor-pointer active:scale-95 transition-transform"
          >
            <span className="block truncate text-[11px] text-slate-400">{metric.label}</span>
            <strong className="mt-1.5 block truncate text-[22px] leading-none font-bold text-slate-900">{metric.value}</strong>
          </button>
        ))}
      </div>

      <button
        onClick={() => currentAccount.workbenchInsight.targetTab && onNavigateToTab(currentAccount.workbenchInsight.targetTab)}
        className="flex w-full items-start gap-3 border-t border-[#f0f3f9] bg-[#f8fbff] px-5 py-3.5 text-left cursor-pointer hover:bg-blue-50/50"
      >
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1a6fd4]"><Sparkles className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-medium text-[#1a6fd4]">{currentAccount.workbenchInsight.eyebrow}</span>
          <strong className="mt-0.5 block text-[12px] text-slate-800">{currentAccount.workbenchInsight.title}</strong>
          <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">{currentAccount.workbenchInsight.description}</span>
        </span>
        <span className="self-center shrink-0 text-[11px] font-medium text-[#1a6fd4]">{currentAccount.workbenchInsight.actionLabel}</span>
      </button>
    </section>
  );

  const renderTools = () => (
    <section className="crm-card">
      <div className="px-5 pr-16 pt-4 pb-3">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">工作必备</h2>
          <p className="mt-0.5 text-[11px] text-slate-400">来自应用中心，仅保留当前角色的高频动作</p>
        </div>
      </div>
      <div className="grid grid-cols-4 border-t border-[#f0f3f9]">
        {quickTools.map((tool) => {
          const Icon = getAppToolIcon(tool.iconName);
          return (
            <button key={tool.id} onClick={() => handleToolLaunch(tool)} className="flex flex-col items-center gap-2 py-4 cursor-pointer hover:bg-blue-50/40">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1a6fd4]"><Icon className="h-5 w-5" /></span>
              <span className="max-w-[70px] truncate text-[11px] font-medium text-slate-700">{tool.quickLabel}</span>
            </button>
          );
        })}
        {quickTools.length < 4 && (
          <button onClick={onOpenAppCenter} className="flex flex-col items-center gap-2 py-4 cursor-pointer hover:bg-blue-50/40">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-[#b9d0ee] bg-[#f8fbff] text-[#1a6fd4]"><Plus className="h-5 w-5" /></span>
            <span className="text-[11px] font-medium text-[#5a6a88]">添加应用</span>
          </button>
        )}
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
