import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Info,
  RefreshCw,
  Route,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { AnalyticsRoleType, ProductAnalyticsEvent } from '../../types';
import {
  calculateOrderedFunnel,
  getAnalyticsDataHealth,
  getMergedAnalyticsEvents,
  getStartOfDay,
  isEventInRange,
  median,
  readLocalAnalyticsEvents,
} from '../../lib/productAnalytics';

type AnalyticsPeriod = 'today' | 'seven_days' | 'twenty_eight_days';
type AnalyticsSource = 'merged' | 'local';
type AnalyticsPerspective = 'journey' | 'adoption';

interface AnalyticsViewProps {
  revision: number;
  onPeriodChanged: (period: AnalyticsPeriod) => void;
  onSourceExplained: () => void;
  onResetLocalData: () => void;
}

type FunnelStep = { label: string; count: number; proxy?: boolean };
type Insight = {
  evidence: string;
  impact: string;
  hypothesis: string;
  experiment: string;
  primary: string;
  guardrail: string;
};

const roleLabels: Record<AnalyticsRoleType, string> = {
  product_expert: '产品专家',
  store_manager: '店长',
  service_manager: '售后经理',
  regional_director: '大区总监',
  delivery_specialist: '交付专员',
  product_operations: '产品运营',
};

const periodLabels: Record<AnalyticsPeriod, string> = {
  today: '今日',
  seven_days: '近 7 天',
  twenty_eight_days: '近 28 天',
};

const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const formatPercent = (part: number, whole: number) => `${percent(part, whole)}%`;
const sessionCount = (events: ProductAnalyticsEvent[]) => new Set(events.map((event) => event.anonymousSessionId)).size;
const businessEvents = (events: ProductAnalyticsEvent[]) => events.filter((event) => event.actorType === 'business');
const shortDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;

const rangeFor = (period: AnalyticsPeriod, previous = false) => {
  const end = new Date();
  end.setHours(24, 0, 0, 0);
  const days = period === 'today' ? 1 : period === 'seven_days' ? 7 : 28;
  const start = getStartOfDay();
  start.setDate(start.getDate() - (days - 1) - (previous ? days : 0));
  const rangeEnd = previous ? new Date(start) : end;
  if (previous) rangeEnd.setDate(rangeEnd.getDate() + days);
  return { start, end: rangeEnd, days };
};

const isWorkbenchEntry = (event: ProductAnalyticsEvent) => event.module === 'workbench' && event.action === 'page_viewed' && event.status === 'viewed';
const isFocusOpened = (event: ProductAnalyticsEvent) => event.module === 'workbench' && (event.action === 'priority_opened' || event.action === 'schedule_opened');
const isDownstreamModule = (event: ProductAnalyticsEvent) => (
  event.action === 'client_opened' || event.action === 'quote_opened'
  || (event.module === 'order_delivery' && event.action === 'page_viewed')
  || event.action === 'test_drive_booked' || event.action === 'delivery_started'
  || (event.module === 'work_essential' && event.action === 'page_viewed')
  || event.action === 'quick_action_started'
);

const getGenericFunnel = (events: ProductAnalyticsEvent[]) => calculateOrderedFunnel(events, [
  { id: 'workbench', matches: isWorkbenchEntry },
  { id: 'focus', matches: isFocusOpened },
  { id: 'downstream', matches: isDownstreamModule },
]);

const getEffectiveWorkSessions = (events: ProductAnalyticsEvent[]) => calculateOrderedFunnel(events, [
  { id: 'workbench', matches: isWorkbenchEntry },
  { id: 'core-action', matches: (event) => isFocusOpened(event) || isDownstreamModule(event) || event.action === 'tool_launched' },
]);

const salesFunnel = (events: ProductAnalyticsEvent[]) => calculateOrderedFunnel(events, [
  { id: 'workbench', matches: isWorkbenchEntry },
  { id: 'client', matches: (event) => event.action === 'client_opened' },
  { id: 'quote', matches: (event) => event.action === 'quote_opened' && event.status === 'started' },
  { id: 'quote-card', matches: (event) => event.action === 'quote_generated' && event.status === 'succeeded' },
  { id: 'handoff', matches: (event) => event.action === 'quote_shared' && event.status === 'external_handoff' },
]);

const roleJourney = (events: ProductAnalyticsEvent[], role: AnalyticsRoleType) => {
  if (role === 'product_expert') {
    const result = salesFunnel(events);
    return {
      title: '产品专家 · 销售下一步',
      description: '外发仅代表报价外发意图，不代表客户收到或成交。',
      steps: ['工作台', '客户 360', '打开报价', '报价卡生成', '外发意图'].map((label, index) => ({ label, count: result.counts[index], proxy: index === 1 || index === 2 || index === 4 })),
      rate: percent(result.counts[4], result.counts[0]),
      rateLabel: '销售下一步意图率',
    };
  }
  const definitions: Record<Exclude<AnalyticsRoleType, 'product_expert' | 'product_operations'>, { title: string; labels: string[]; start: (event: ProductAnalyticsEvent) => boolean }> = {
    store_manager: { title: '店长 · 经营决策流程', labels: ['工作台', '进入经营模块', '决策流程发起'], start: (event) => event.action === 'quick_action_started' },
    regional_director: { title: '大区总监 · 经营决策流程', labels: ['工作台', '进入经营模块', '决策流程发起'], start: (event) => event.action === 'quick_action_started' },
    service_manager: { title: '售后经理 · 服务流程', labels: ['工作台', '进入服务模块', '流程发起'], start: (event) => event.action === 'test_drive_booked' },
    delivery_specialist: { title: '交付专员 · 交付流程', labels: ['工作台', '进入订单模块', '流程发起'], start: (event) => event.action === 'delivery_started' },
  };
  const config = definitions[role];
  const result = calculateOrderedFunnel(events, [
    { id: 'workbench', matches: isWorkbenchEntry },
    { id: 'module', matches: (event) => role === 'service_manager' || role === 'delivery_specialist'
      ? event.module === 'order_delivery' && event.action === 'page_viewed'
      : event.module === 'work_essential' && event.action === 'page_viewed' },
    { id: 'start', matches: config.start },
  ]);
  return {
    title: config.title,
    description: '仅记录流程发起；当前界面尚无可验证的完成状态。',
    steps: config.labels.map((label, index) => ({ label, count: result.counts[index], proxy: index > 0 })),
    rate: percent(result.counts[2], result.counts[0]),
    rateLabel: '流程发起率',
  };
};

const featureDefinitions = [
  { label: '工作台', matches: (event: ProductAnalyticsEvent) => event.module === 'workbench' },
  { label: '工作必备', matches: (event: ProductAnalyticsEvent) => event.module === 'work_essential' },
  { label: '应用中心', matches: (event: ProductAnalyticsEvent) => event.module === 'app_center' },
  { label: '一线 Lab', matches: (event: ProductAnalyticsEvent) => event.properties?.toolType === 'lab_tool' },
  { label: '客户 360', matches: (event: ProductAnalyticsEvent) => event.module === 'client_360' },
  { label: '报价', matches: (event: ProductAnalyticsEvent) => event.module === 'quote' },
  { label: '试驾 / 订单', matches: (event: ProductAnalyticsEvent) => event.module === 'test_drive' || event.module === 'order_delivery' },
  { label: '小万', matches: (event: ProductAnalyticsEvent) => event.module === 'xiaowan' },
];

const sameBrowserReuse = (events: ProductAnalyticsEvent[]) => {
  const adds = events.filter((event) => event.action === 'tool_configured' && event.properties?.configurationAction === 'add');
  const launches = events.filter((event) => event.action === 'tool_launched');
  const reused = new Set(adds.filter((add) => launches.some((launch) => (
    launch.anonymousBrowserId === add.anonymousBrowserId
    && Date.parse(launch.occurredAt) >= Date.parse(add.occurredAt)
    && Date.parse(launch.occurredAt) - Date.parse(add.occurredAt) <= 7 * 24 * 60 * 60 * 1000
  ))).map((add) => add.anonymousSessionId));
  return { configured: new Set(adds.map((event) => event.anonymousSessionId)).size, reused: reused.size };
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ revision, onPeriodChanged, onSourceExplained, onResetLocalData }) => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('seven_days');
  const [source, setSource] = useState<AnalyticsSource>('merged');
  const [perspective, setPerspective] = useState<AnalyticsPerspective>('journey');
  const [roleFilter, setRoleFilter] = useState<'all' | AnalyticsRoleType>('all');
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [hasReset, setHasReset] = useState(false);

  const dashboard = useMemo(() => {
    const allEvents = source === 'merged' ? getMergedAnalyticsEvents() : readLocalAnalyticsEvents();
    const currentRange = rangeFor(period);
    const priorRange = rangeFor(period, true);
    const applyFilters = (events: ProductAnalyticsEvent[]) => businessEvents(events).filter((event) => (
      roleFilter === 'all' || event.roleType === roleFilter
    ));
    const inCurrent = applyFilters(allEvents.filter((event) => isEventInRange(event, currentRange.start, currentRange.end)));
    const inPrior = applyFilters(allEvents.filter((event) => isEventInRange(event, priorRange.start, priorRange.end)));
    const generic = getGenericFunnel(inCurrent);
    const genericPrior = getGenericFunnel(inPrior);
    const effective = getEffectiveWorkSessions(inCurrent);
    const recommendationShown = calculateOrderedFunnel(inCurrent, [
      { id: 'shown', matches: (event) => event.action === 'recommendation_shown' },
      { id: 'accepted', matches: (event) => event.action === 'recommendation_accepted' },
    ]);
    const automatic = calculateOrderedFunnel(inCurrent, [
      { id: 'shown', matches: (event) => event.action === 'recommendation_shown' },
      { id: 'automatic', matches: (event) => event.action === 'priority_transferred' && event.properties?.method === 'automatic' },
    ]);
    const transferOpened = calculateOrderedFunnel(inCurrent, [
      { id: 'shown', matches: (event) => event.action === 'recommendation_shown' },
      { id: 'transferred', matches: (event) => event.action === 'priority_transferred' },
      { id: 'opened', matches: (event) => event.action === 'transferred_priority_opened' },
    ]);
    const selectedJourney = roleFilter !== 'all' && roleFilter !== 'product_operations' ? roleJourney(inCurrent, roleFilter) : null;
    const features = featureDefinitions.map((feature) => {
      const featureEvents = inCurrent.filter(feature.matches);
      const sessions = new Set(featureEvents.map((event) => event.anonymousSessionId)).size;
      return { ...feature, sessions, depth: sessions ? Math.round((featureEvents.length / sessions) * 10) / 10 : 0 };
    }).sort((a, b) => b.sessions - a.sessions || b.depth - a.depth);
    const appCenter = calculateOrderedFunnel(inCurrent, [
      { id: 'open', matches: (event) => event.action === 'app_center_opened' },
      { id: 'detail', matches: (event) => event.action === 'tool_detail_viewed' },
      { id: 'add', matches: (event) => event.action === 'tool_configured' && event.properties?.configurationAction === 'add' },
      { id: 'launch', matches: (event) => event.action === 'tool_launched' },
    ]);
    const lab = calculateOrderedFunnel(inCurrent, [
      { id: 'open', matches: (event) => event.action === 'lab_opened' },
      { id: 'detail', matches: (event) => event.action === 'lab_tool_viewed' },
      { id: 'support', matches: (event) => event.action === 'lab_tool_supported' && event.status === 'succeeded' },
    ]);
    const labLearning = calculateOrderedFunnel(inCurrent, [
      { id: 'tutorial', matches: (event) => event.action === 'lab_tutorial_opened' },
      { id: 'review', matches: (event) => event.action === 'lab_submission_started' && event.status === 'started' },
    ]);
    const personalization = sameBrowserReuse(inCurrent);
    const layoutReorderedSessions = new Set(inCurrent.filter((event) => event.action === 'layout_reordered').map((event) => event.anonymousSessionId)).size;
    const validSessionCount = effective.counts[1];
    const trendUnits = period === 'twenty_eight_days' ? 4 : period === 'seven_days' ? 7 : 1;
    const trend = Array.from({ length: trendUnits }, (_, index) => {
      const unitStart = new Date(currentRange.start);
      const unitDays = period === 'twenty_eight_days' ? 7 : 1;
      unitStart.setDate(unitStart.getDate() + index * unitDays);
      const unitEnd = new Date(unitStart);
      unitEnd.setDate(unitEnd.getDate() + unitDays);
      const unitEvents = applyFilters(allEvents.filter((event) => isEventInRange(event, unitStart, unitEnd)));
      const unitFunnel = getGenericFunnel(unitEvents);
      return {
        label: period === 'twenty_eight_days' ? `第 ${index + 1} 周` : shortDate(unitStart),
        sessions: sessionCount(unitEvents),
        rate: percent(unitFunnel.counts[2], unitFunnel.counts[0]),
      };
    });
    const quality = getAnalyticsDataHealth();
    const localOperations = allEvents.filter((event) => event.actorType === 'operations' && isEventInRange(event, currentRange.start, currentRange.end)).length;
    const salesCurrent = inCurrent.filter((event) => event.roleType === 'product_expert');
    const salesPrior = inPrior.filter((event) => event.roleType === 'product_expert');
    const sales = salesFunnel(salesCurrent);
    const previousSales = salesFunnel(salesPrior);
    const currentActivation = percent(appCenter.counts[3], appCenter.counts[0]);
    const previousAppCenter = calculateOrderedFunnel(inPrior, [
      { id: 'open', matches: (event) => event.action === 'app_center_opened' },
      { id: 'detail', matches: (event) => event.action === 'tool_detail_viewed' },
      { id: 'add', matches: (event) => event.action === 'tool_configured' && event.properties?.configurationAction === 'add' },
      { id: 'launch', matches: (event) => event.action === 'tool_launched' },
    ]);
    const previousActivation = percent(previousAppCenter.counts[3], previousAppCenter.counts[0]);
    const previousLab = calculateOrderedFunnel(inPrior, [
      { id: 'open', matches: (event) => event.action === 'lab_opened' },
      { id: 'detail', matches: (event) => event.action === 'lab_tool_viewed' },
      { id: 'support', matches: (event) => event.action === 'lab_tool_supported' && event.status === 'succeeded' },
    ]);
    const labSupportRate = percent(lab.counts[2], lab.counts[1]);
    const previousLabSupportRate = percent(previousLab.counts[2], previousLab.counts[1]);
    const manualAdoption = percent(recommendationShown.counts[1], recommendationShown.counts[0]);
    const priorRecommendation = calculateOrderedFunnel(inPrior, [
      { id: 'shown', matches: (event) => event.action === 'recommendation_shown' },
      { id: 'accepted', matches: (event) => event.action === 'recommendation_accepted' },
    ]);
    const previousManualAdoption = percent(priorRecommendation.counts[1], priorRecommendation.counts[0]);
    const salesIntent = percent(sales.counts[4], sales.counts[0]);
    const previousSalesIntent = percent(previousSales.counts[4], previousSales.counts[0]);
    const completeEnough = !quality.invalidOrUnknownEvents;
    const meaningful = (sample: number, current: number, prior: number) => sample >= 12 && completeEnough && Math.abs(current - prior) >= 5;
    const insights: Insight[] = [
      ...(meaningful(lab.counts[1], labSupportRate, previousLabSupportRate) && labSupportRate < 55 ? [{
        evidence: `Lab 工具详情查看 ${lab.counts[1]} 个会话，支持率 ${labSupportRate}%（前周期 ${previousLabSupportRate}%）。`,
        impact: '相关信号：一线工具已被看见，但价值、适用边界或可信度尚未形成共识。',
        hypothesis: '员工无法快速判断实验工具是否适用于自己的岗位，或担心其维护与数据风险。',
        experiment: '在 Lab 卡片补充适用场景、稳定运行窗口和代码审核状态，并提供一键试用说明。',
        primary: 'Lab 工具支持率',
        guardrail: '代码审核发起率不下降',
      }] : []),
      ...(meaningful(appCenter.counts[0], currentActivation, previousActivation) && currentActivation < 45 ? [{
        evidence: `应用中心触达 ${appCenter.counts[0]} 个会话，工具激活率 ${currentActivation}%（前周期 ${previousActivation}%）。`,
        impact: '相关信号：发现能力并未稳定沉淀为日常入口。',
        hypothesis: '角色首次选择成本过高，用户尚未形成“工作必备”的默认配置。',
        experiment: '按角色预置 2 个高频应用，并提供一键确认而非完整配置。',
        primary: '工具激活率',
        guardrail: '工作台首屏可用操作数不下降',
      }] : []),
      ...(meaningful(sales.counts[0], salesIntent, previousSalesIntent) && salesIntent < 40 ? [{
        evidence: `产品专家报价产出后外发意图率 ${salesIntent}%（n=${sales.counts[0]}，前周期 ${previousSalesIntent}%）。`,
        impact: '相关信号：报价链路承接存在，但最后一步仍有明显流失。',
        hypothesis: '报价摘要不足以支持顾问直接向客户发出下一步信息。',
        experiment: '在发送前增加精简报价摘要与下一步话术入口。',
        primary: '报价外发意图率',
        guardrail: '报价生成中位耗时不增加',
      }] : []),
      ...(meaningful(recommendationShown.counts[0], manualAdoption, previousManualAdoption) && manualAdoption < 45 ? [{
        evidence: `推荐展示 ${recommendationShown.counts[0]} 个会话，手工采纳率 ${manualAdoption}%（前周期 ${previousManualAdoption}%）。`,
        impact: '相关信号：用户可能未理解推荐依据，或担心失去对任务优先级的控制。',
        hypothesis: '可解释性与可撤回性不足，降低了主动采纳意愿。',
        experiment: '展示优先级、时效、客户影响依据，并提供撤回入口。',
        primary: '手工采纳率',
        guardrail: '推荐后事项打开率不下降',
      }] : []),
    ].slice(0, 3);
    const medianProgressMs = median(generic.completedDurationsMs);
    return {
      generic,
      genericPrior,
      effective,
      recommendationShown,
      automatic,
      transferOpened,
      selectedJourney,
      features,
      appCenter,
      lab,
      labLearning,
      personalization,
      layoutReorderedSessions,
      validSessionCount,
      trend,
      quality,
      localOperations,
      localEventCount: readLocalAnalyticsEvents().length,
      sales,
      salesIntent,
      medianProgressMs,
      insights,
      allBusinessSessions: sessionCount(inCurrent),
      roleComparison: (['product_expert', 'store_manager', 'service_manager', 'regional_director', 'delivery_specialist'] as AnalyticsRoleType[]).map((role) => {
        const roleEvents = businessEvents(allEvents.filter((event) => isEventInRange(event, currentRange.start, currentRange.end) && event.roleType === role));
        const roleFunnel = getGenericFunnel(roleEvents);
        return { role, sessions: roleFunnel.counts[0], rate: percent(roleFunnel.counts[2], roleFunnel.counts[0]) };
      }),
    };
  // revision deliberately refreshes localStorage-derived data after a real action.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, roleFilter, revision, source]);

  const maximumSessions = Math.max(...dashboard.trend.map((item) => item.sessions), 1);
  const trendPoints = dashboard.trend.length === 1 ? '50,50' : dashboard.trend.map((item, index) => {
    const x = (index / (dashboard.trend.length - 1)) * 100;
    const y = 94 - item.rate * 0.86;
    return `${x},${Math.max(4, Math.min(94, y))}`;
  }).join(' ');
  const funnelRows: FunnelStep[] = [
    { label: '进入工作台', count: dashboard.generic.counts[0] },
    { label: '打开关键事项 / 行程', count: dashboard.generic.counts[1] },
    { label: '进入下游模块', count: dashboard.generic.counts[2], proxy: true },
  ];
  const focusRoleMetric = dashboard.selectedJourney
    ? { label: dashboard.selectedJourney.rateLabel, value: `${dashboard.selectedJourney.rate}%`, detail: '业务过程代理' }
    : { label: '中位推进耗时', value: dashboard.generic.counts[2] >= 20 && dashboard.medianProgressMs !== null ? `${Math.round(dashboard.medianProgressMs / 60000)} 分` : '样本不足', detail: dashboard.generic.counts[2] >= 20 ? '工作台至下游模块' : `完成路径 n=${dashboard.generic.counts[2]}，需 ≥20` };

  const changePeriod = (next: AnalyticsPeriod) => {
    setPeriod(next);
    onPeriodChanged(next);
  };
  const reset = () => {
    onResetLocalData();
    setHasReset(true);
    window.setTimeout(() => setHasReset(false), 2200);
  };

  return (
    <div className="crm-page space-y-3.5 pb-7 select-none" aria-label="产品运营驾驶舱">
      <section className="rounded-2xl border border-[#dce9f7] bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_68%,#f1f7fe_100%)] p-4 shadow-[0_8px_24px_rgba(26,111,212,.07)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold tracking-[.16em] text-[#1a6fd4]">PRODUCT OPERATIONS · 2.0</span>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">产品运营驾驶舱</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-[#5a6a88]">从工作推进与采用深度，定位下一项可验证的产品实验。</p>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1a6fd4] text-white shadow-sm"><BarChart3 className="h-[18px] w-[18px]" /></span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#e6eef8] pt-3">
          <button onClick={() => { setIsSourceOpen((open) => !open); onSourceExplained(); }} className="flex min-w-0 items-center gap-1.5 text-left text-[10px] font-medium text-[#5a6a88] cursor-pointer">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span className="truncate">{source === 'merged' ? '合并演示基线 + 本机实时行为' : '仅本机实时行为'}</span><Info className="h-3.5 w-3.5 shrink-0 text-[#6f92bd]" />
          </button>
          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-[#1a6fd4]">本机 {dashboard.localEventCount} 条</span>
        </div>
        {isSourceOpen && <div className="mt-2.5 rounded-xl border border-[#dce9f7] bg-white/85 p-3 text-[10px] leading-relaxed text-[#5a6a88]">演示基线为 56 天可重复数据；本机行为只存于当前浏览器。仅保留匿名浏览器 / 30 分钟会话、角色、模块、枚举动作与状态，不采集客户、金额、搜索词或对话文本。产品运营自己的浏览仅计入数据健康，不计入下方业务指标。</div>}
      </section>

      <div className="flex border-b border-[#dce6f1] px-1" role="tablist" aria-label="运营分析视角">
        {([['journey', '业务旅程'], ['adoption', '功能采用']] as const).map(([value, label]) => <button key={value} role="tab" aria-selected={perspective === value} onClick={() => setPerspective(value)} className={`relative mr-5 pb-2.5 text-xs cursor-pointer ${perspective === value ? 'font-bold text-[#1a6fd4]' : 'font-medium text-slate-400'}`}>{label}{perspective === value && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#1a6fd4]" />}</button>)}
      </div>

      <section className="rounded-xl border border-[#e1eaf5] bg-white px-3 py-2.5 shadow-[0_2px_10px_rgba(30,70,160,.04)]">
        <div className="grid grid-cols-[1fr_1fr] gap-2">
          <label className="text-[9px] font-medium text-slate-400">时间范围<select value={period} onChange={(event) => changePeriod(event.target.value as AnalyticsPeriod)} className="mt-1 block h-8 w-full rounded-lg border border-[#dce6f1] bg-white px-2 text-[11px] font-semibold text-slate-700 outline-none"><option value="today">今日</option><option value="seven_days">近 7 天</option><option value="twenty_eight_days">近 28 天</option></select></label>
          <label className="text-[9px] font-medium text-slate-400">数据来源<select value={source} onChange={(event) => setSource(event.target.value as AnalyticsSource)} className="mt-1 block h-8 w-full rounded-lg border border-[#dce6f1] bg-white px-2 text-[11px] font-semibold text-slate-700 outline-none"><option value="merged">合并演示</option><option value="local">仅本机</option></select></label>
        </div>
        <label className="mt-2 block text-[9px] font-medium text-slate-400">体验角色<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as 'all' | AnalyticsRoleType)} className="mt-1 block h-8 w-full rounded-lg border border-[#dce6f1] bg-white px-2 text-[11px] font-semibold text-slate-700 outline-none"><option value="all">全部业务角色 · 通用工作推进</option>{Object.entries(roleLabels).filter(([value]) => value !== 'product_operations').map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <div className="mt-2 flex items-center justify-between text-[9px] text-[#6a7b98]"><span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" />v2 结构完整 {dashboard.quality.invalidOrUnknownEvents ? '存在未知缓存，已隔离' : '· 可用于顺序漏斗'}</span><button onClick={reset} className="flex items-center gap-1 font-medium hover:text-[#1a6fd4] cursor-pointer"><RefreshCw className="h-3 w-3" />{hasReset ? '已重置' : '重置本机数据'}</button></div>
      </section>

      {perspective === 'journey' ? <>
        <section className="grid grid-cols-3 gap-2">
          {[{ label: '有效工作会话', value: dashboard.effective.counts[1], detail: `工作台后完成核心动作 / ${dashboard.effective.counts[0]}` }, { label: '工作推进率', value: `${percent(dashboard.generic.counts[2], dashboard.generic.counts[0])}%`, detail: `严格顺序 n=${dashboard.generic.counts[0]}` }, { label: '智能推荐采纳率', value: `${formatPercent(dashboard.recommendationShown.counts[1], dashboard.recommendationShown.counts[0])}`, detail: `手工 n=${dashboard.recommendationShown.counts[0]}` }].map((metric) => <article key={metric.label} className="crm-card min-h-[110px] p-3"><p className="text-[10px] font-medium leading-tight text-[#5a6a88]">{metric.label}</p><strong className="mt-3 block text-[21px] font-extrabold leading-none tracking-tight text-slate-900">{metric.value}</strong><p className="mt-2 text-[9px] leading-relaxed text-slate-400">{metric.detail}</p></article>)}
        </section>

        <section className="crm-card overflow-hidden">
          <div className="flex items-start justify-between px-4 pb-3 pt-4"><div><h3 className="text-sm font-extrabold text-slate-900">通用工作推进</h3><p className="mt-0.5 text-[10px] text-slate-400">同一 30 分钟会话内，必须按实际时间顺序发生</p></div><span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-700">业务过程代理</span></div>
          <div className="space-y-3 px-4 pb-4">{funnelRows.map((step, index) => { const base = funnelRows[0].count || 1; return <div key={step.label} className="grid grid-cols-[106px_1fr_38px] items-center gap-2"><span className="truncate text-[10px] font-medium text-[#455775]">{step.label}</span><div className="h-2 overflow-hidden rounded-full bg-[#edf3f9]"><div className="h-full rounded-full bg-[linear-gradient(90deg,#1a6fd4,#79afe7)]" style={{ width: `${Math.max(7, percent(step.count, base))}%` }} /></div><span className="text-right text-[10px] font-bold text-slate-700">{step.count}<small className="ml-0.5 font-normal text-slate-400">{index ? `/${percent(step.count, funnelRows[index - 1].count)}%` : ''}</small></span></div>; })}</div>
        </section>

        <section className="grid grid-cols-[1.15fr_.85fr] gap-2.5">
          <article className="crm-card p-3.5"><div className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-[#1a6fd4]" /><h3 className="text-[11px] font-bold text-slate-800">{focusRoleMetric.label}</h3></div><strong className="mt-3 block text-[20px] font-extrabold text-slate-900">{focusRoleMetric.value}</strong><p className="mt-1 text-[9px] leading-relaxed text-slate-400">{focusRoleMetric.detail}</p></article>
          <article className="crm-card p-3.5"><div className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[#1a6fd4]" /><h3 className="text-[11px] font-bold text-slate-800">自动执行</h3></div><strong className="mt-3 block text-[20px] font-extrabold text-slate-900">{formatPercent(dashboard.automatic.counts[1], dashboard.automatic.counts[0])}</strong><p className="mt-1 text-[9px] leading-relaxed text-slate-400">单列，不计入手工采纳</p></article>
        </section>

        {dashboard.selectedJourney ? <section className="crm-card overflow-hidden"><div className="px-4 pb-3 pt-4"><h3 className="text-sm font-extrabold text-slate-900">{dashboard.selectedJourney.title}</h3><p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">{dashboard.selectedJourney.description}</p></div><div className="flex border-t border-[#edf3f9]">{dashboard.selectedJourney.steps.map((step, index) => <React.Fragment key={step.label}><div className="min-w-0 flex-1 px-2 py-3 text-center"><strong className="block text-[16px] text-slate-900">{step.count}</strong><span className="mt-1 block truncate text-[9px] text-[#5a6a88]">{step.label}</span>{step.proxy && <span className="mt-1 block text-[8px] text-amber-700">代理</span>}</div>{index < dashboard.selectedJourney.steps.length - 1 && <ChevronRight className="mt-5 h-3 w-3 shrink-0 text-[#aab8cd]" />}</React.Fragment>)}</div></section> : <section className="rounded-xl border border-dashed border-[#cbdcf0] bg-[#f8fbff] p-3 text-[10px] leading-relaxed text-[#5a6a88]"><Route className="mr-1 inline h-3.5 w-3.5 text-[#1a6fd4]" />选择一个业务角色以查看专属旅程。各角色不共享销售漏斗；没有可验证完成状态的模块只展示“流程发起”。</section>}

        <section className="crm-card p-4"><div className="flex items-start justify-between"><div><h3 className="text-sm font-extrabold text-slate-900">使用趋势</h3><p className="mt-0.5 text-[10px] text-slate-400">会话量柱图与推进率折线分层展示</p></div><span className="text-[9px] font-medium text-[#6a7b98]">{periodLabels[period]}</span></div><div className="mt-4"><p className="text-[9px] text-slate-400">有效会话量</p><div className="mt-1 flex h-14 items-end gap-2">{dashboard.trend.map((item) => <div key={item.label} className="flex min-w-0 flex-1 items-end justify-center"><span className="w-full max-w-7 rounded-t-[3px] bg-[#bcd8f4]" style={{ height: `${Math.max(item.sessions ? 6 : 2, (item.sessions / maximumSessions) * 52)}px` }} /></div>)}</div><p className="mt-3 text-[9px] text-slate-400">工作推进率</p><div className="relative mt-1 h-12 border-b border-l border-[#edf3f9]"><svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible"><polyline fill="none" stroke="#1a6fd4" strokeWidth="4" vectorEffect="non-scaling-stroke" points={trendPoints} /></svg></div><div className="mt-1 flex justify-between text-[8px] text-slate-400">{dashboard.trend.map((item) => <span key={item.label}>{item.label} · {item.rate}%</span>)}</div></div></section>
      </> : <>
        <section className="crm-card p-4"><div className="flex items-start justify-between"><div><h3 className="text-sm font-extrabold text-slate-900">功能采用</h3><p className="mt-0.5 text-[10px] text-slate-400">按独立业务会话的触达率与使用深度排序，不按原始点击量</p></div><span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-semibold text-[#1a6fd4]">业务会话 n={dashboard.allBusinessSessions}</span></div><div className="mt-4 space-y-2.5">{dashboard.features.map((feature, index) => <div key={feature.label} className="grid grid-cols-[15px_72px_1fr_46px] items-center gap-2"><span className="text-[10px] font-bold text-[#8a9ab8]">{index + 1}</span><span className="truncate text-[10px] font-medium text-[#455775]">{feature.label}</span><div className="h-1.5 overflow-hidden rounded-full bg-[#edf3f9]"><div className="h-full rounded-full bg-[#1a6fd4]" style={{ width: `${Math.max(4, percent(feature.sessions, dashboard.allBusinessSessions || 1))}%` }} /></div><span className="text-right text-[9px] text-slate-500">{formatPercent(feature.sessions, dashboard.allBusinessSessions)} · {feature.depth}x</span></div>)}</div><p className="mt-3 text-[9px] text-slate-400">展示：触达率 · 使用深度（每触达会话平均事件数）</p></section>

        <section className="crm-card overflow-hidden"><div className="px-4 pb-3 pt-4"><h3 className="text-sm font-extrabold text-slate-900">应用中心 → 工作必备</h3><p className="mt-0.5 text-[10px] text-slate-400">严格顺序漏斗，用于识别“发现高、沉淀低”</p></div><div className="grid grid-cols-4 border-t border-[#edf3f9]">{['打开应用中心', '查看工具', '添加工作必备', '再次启动'].map((label, index) => <div key={label} className="min-w-0 px-2 py-3 text-center"><strong className="block text-[17px] text-slate-900">{dashboard.appCenter.counts[index]}</strong><span className="mt-1 block text-[9px] leading-tight text-[#5a6a88]">{label}</span>{index > 0 && <span className="mt-1 block text-[8px] text-slate-400">{formatPercent(dashboard.appCenter.counts[index], dashboard.appCenter.counts[index - 1])}</span>}</div>)}</div></section>

        <section className="crm-card overflow-hidden"><div className="px-4 pb-3 pt-4"><div className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-[#1a6fd4]" /><h3 className="text-sm font-extrabold text-slate-900">一线 Lab 共创</h3></div><p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">支持表示实验价值信号；审核发起仅代表提交意图，不代表代码已通过。</p></div><div className="grid grid-cols-3 border-y border-[#edf3f9]">{['进入 Lab', '查看工具', '支持工具'].map((label, index) => <div key={label} className="min-w-0 px-2 py-3 text-center"><strong className="block text-[17px] text-slate-900">{dashboard.lab.counts[index]}</strong><span className="mt-1 block text-[9px] leading-tight text-[#5a6a88]">{label}</span>{index > 0 && <span className="mt-1 block text-[8px] text-slate-400">{formatPercent(dashboard.lab.counts[index], dashboard.lab.counts[index - 1])}</span>}</div>)}</div><div className="flex items-center justify-between px-4 py-3"><span className="text-[10px] text-[#5a6a88]">教程查看 → 发起代码审核</span><strong className="text-[11px] text-[#1a2438]">{dashboard.labLearning.counts[0]} → {dashboard.labLearning.counts[1]} <span className="font-normal text-[#8a9ab8]">· {formatPercent(dashboard.labLearning.counts[1], dashboard.labLearning.counts[0])}</span></strong></div></section>

        <section className="crm-card p-4"><div className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-[#1a6fd4]" /><h3 className="text-sm font-extrabold text-slate-900">智能推荐状态阶梯</h3></div><div className="mt-3 grid grid-cols-4 gap-1.5 text-center"><div><strong className="text-[17px] text-slate-900">{dashboard.recommendationShown.counts[0]}</strong><span className="mt-1 block text-[9px] text-[#5a6a88]">推荐展示</span></div><div><strong className="text-[17px] text-slate-900">{dashboard.recommendationShown.counts[1]}</strong><span className="mt-1 block text-[9px] text-[#5a6a88]">手工接受</span></div><div><strong className="text-[17px] text-slate-900">{dashboard.automatic.counts[1]}</strong><span className="mt-1 block text-[9px] text-[#5a6a88]">自动执行</span></div><div><strong className="text-[17px] text-slate-900">{dashboard.transferOpened.counts[2]}</strong><span className="mt-1 block text-[9px] text-[#5a6a88]">转入后打开</span></div></div><p className="mt-3 text-[9px] leading-relaxed text-slate-400">手工采纳与自动执行永远分开统计；自动执行不是主动采纳。</p></section>

        <section className="grid grid-cols-3 gap-2"><article className="crm-card p-3"><SlidersHorizontal className="h-3.5 w-3.5 text-[#1a6fd4]" /><strong className="mt-3 block text-[18px] text-slate-900">{formatPercent(dashboard.personalization.configured, dashboard.validSessionCount)}</strong><p className="mt-1 text-[9px] text-[#5a6a88]">工作必备配置率</p></article><article className="crm-card p-3"><SlidersHorizontal className="h-3.5 w-3.5 text-[#1a6fd4]" /><strong className="mt-3 block text-[18px] text-slate-900">{formatPercent(dashboard.layoutReorderedSessions, dashboard.validSessionCount)}</strong><p className="mt-1 text-[9px] text-[#5a6a88]">面板排序率</p></article><article className="crm-card p-3"><SlidersHorizontal className="h-3.5 w-3.5 text-[#1a6fd4]" /><strong className="mt-3 block text-[18px] text-slate-900">{formatPercent(dashboard.personalization.reused, dashboard.personalization.configured)}</strong><p className="mt-1 text-[9px] text-[#5a6a88]">配置后复用率</p></article></section>

        <section className="crm-card p-4"><div className="flex items-start justify-between"><div><h3 className="text-sm font-extrabold text-slate-900">角色工作推进对比</h3><p className="mt-0.5 text-[10px] text-slate-400">标准化推进率，不比较原始点击量</p></div><span className="text-[9px] text-[#6a7b98]">严格顺序</span></div><div className="mt-3 space-y-2.5">{dashboard.roleComparison.map((item) => <div key={item.role} className="grid grid-cols-[52px_1fr_53px] items-center gap-2"><span className="truncate text-[10px] font-medium text-[#455775]">{roleLabels[item.role]}</span><div className="h-2 overflow-hidden rounded-full bg-[#edf3f9]"><div className="h-full rounded-full bg-[#1a6fd4]" style={{ width: `${item.rate}%` }} /></div><span className="text-right text-[9px] text-slate-500">{item.rate}% · n={item.sessions}</span></div>)}</div></section>
      </>}

      <section className="space-y-2.5"><div className="flex items-center justify-between px-0.5"><div><h3 className="text-sm font-extrabold text-slate-900">运营结论</h3><p className="mt-0.5 text-[10px] text-slate-400">只有样本 n≥12、事件完整且与前周期出现 ≥5pp 方向变化时展示</p></div><BrainCircuit className="h-4 w-4 text-[#1a6fd4]" /></div>{dashboard.insights.length ? dashboard.insights.map((insight, index) => <article key={insight.evidence} className="crm-card border-l-[3px] border-l-[#1a6fd4] p-3.5"><span className="text-[10px] font-bold text-[#1a6fd4]">0{index + 1} · 相关信号</span><p className="mt-1 text-[11px] font-bold leading-relaxed text-slate-800">证据：{insight.evidence}</p><p className="mt-1 text-[10px] leading-relaxed text-[#5a6a88]">影响：{insight.impact}</p><p className="mt-1 text-[10px] leading-relaxed text-[#5a6a88]">待验证假设：{insight.hypothesis}</p><div className="mt-2 border-t border-[#edf3f9] pt-2 text-[10px] leading-relaxed text-[#1a6fd4]"><ChevronRight className="inline h-3 w-3" />实验：{insight.experiment}<br /><span className="text-slate-500">主指标：{insight.primary} · 护栏：{insight.guardrail}</span></div></article>) : <article className="rounded-xl border border-dashed border-[#cbdcf0] bg-[#f8fbff] p-3 text-[10px] leading-relaxed text-[#5a6a88]">当前未满足“样本量 + 事件完整度 + 前周期方向变化”的结论门槛。继续收集行为，不以弱信号输出因果判断。</article>}</section>

      <section className="rounded-xl border border-[#e1eaf5] bg-white p-3 text-[9px] leading-relaxed text-[#6a7b98]">数据健康：本期产品运营浏览 {dashboard.localOperations} 条，仅用于健康监测；{dashboard.quality.legacyEventsDetected ? '检测到旧版本机缓存，已安全隔离，不进入严格漏斗。' : '未发现会污染严格口径的旧版缓存。'} 真实成交、客户阅读、试驾完成与订单完成均为不可观测结果，本期不展示数值。</section>
    </div>
  );
};
