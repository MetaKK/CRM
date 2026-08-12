import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  ChevronRight,
  Info,
  LayoutPanelTop,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react';
import { ProductAnalyticsEvent } from '../../types';
import {
  getDemoAnalyticsEvents,
  getStartOfDay,
  isEventInRange,
  readLocalAnalyticsEvents,
} from '../../lib/productAnalytics';

type AnalyticsPeriod = 'seven_days' | 'today';

interface AnalyticsViewProps {
  revision: number;
  onPeriodChanged: (period: AnalyticsPeriod) => void;
  onSourceExplained: () => void;
  onResetLocalData: () => void;
}

type Metric = {
  label: string;
  value: string;
  detail: string;
  change: number | null;
  tone: 'blue' | 'emerald' | 'indigo' | 'amber';
  icon: React.ReactNode;
};

const keyActions = new Set([
  'priority_opened', 'client_opened', 'quote_generated', 'quote_shared',
  'test_drive_booked', 'test_drive_released', 'order_created', 'delivery_started',
]);

const eventDateLabel = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;
const percent = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const setCount = (events: ProductAnalyticsEvent[]) => new Set(events.map((event) => event.anonymousSessionId)).size;
const isBusiness = (event: ProductAnalyticsEvent) => event.actorType === 'business';

const metricChange = (value: number, previous: number) => {
  if (previous === 0) return value ? 100 : null;
  return Math.round(((value - previous) / previous) * 100);
};

const selectMetrics = (events: ProductAnalyticsEvent[]) => {
  const businessEvents = events.filter(isBusiness);
  const activeSessions = setCount(businessEvents);
  const keySessionCount = setCount(businessEvents.filter((event) => keyActions.has(event.action)));
  const workbenchVisitors = new Set(
    businessEvents.filter((event) => event.module === 'workbench' && event.action === 'page_viewed').map((event) => event.anonymousSessionId),
  );
  const workbenchParticipants = new Set(
    businessEvents.filter((event) => event.module === 'workbench' && !['page_viewed', 'app_opened'].includes(event.action)).map((event) => event.anonymousSessionId),
  );
  const autoCandidates = new Set(
    businessEvents.filter((event) => event.module === 'workbench' && event.action === 'page_viewed').map((event) => event.anonymousSessionId),
  );
  const autoAdopters = new Set(
    businessEvents.filter((event) => event.action === 'auto_transfer_executed' || (event.action === 'auto_transfer_toggled' && event.result === 'enabled')).map((event) => event.anonymousSessionId),
  );

  return {
    activeSessions,
    keyActionRate: percent(keySessionCount, activeSessions),
    workbenchRate: percent([...workbenchParticipants].filter((session) => workbenchVisitors.has(session)).length, workbenchVisitors.size),
    autoTransferRate: percent([...autoAdopters].filter((session) => autoCandidates.has(session)).length, autoCandidates.size),
  };
};

const featureDefinitions = [
  { label: '工作台', matches: (event: ProductAnalyticsEvent) => event.module === 'workbench', tone: 'bg-[#1a6fd4]' },
  { label: '工作必备', matches: (event: ProductAnalyticsEvent) => event.module === 'work_essential', tone: 'bg-[#4d8ee3]' },
  { label: '应用中心', matches: (event: ProductAnalyticsEvent) => event.module === 'app_center', tone: 'bg-[#7d9fd7]' },
  { label: '客户 360', matches: (event: ProductAnalyticsEvent) => event.module === 'client_360', tone: 'bg-[#20a875]' },
  { label: '报价', matches: (event: ProductAnalyticsEvent) => event.module === 'quote', tone: 'bg-[#e7a32a]' },
  { label: '试驾 / 订单', matches: (event: ProductAnalyticsEvent) => event.module === 'test_drive' || event.module === 'order_delivery', tone: 'bg-[#8c6fdb]' },
  { label: '小万', matches: (event: ProductAnalyticsEvent) => event.module === 'xiaowan', tone: 'bg-[#e06d9f]' },
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  revision,
  onPeriodChanged,
  onSourceExplained,
  onResetLocalData,
}) => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('seven_days');
  const [isSourceOpen, setIsSourceOpen] = useState(false);
  const [hasReset, setHasReset] = useState(false);

  const dashboard = useMemo(() => {
    const allEvents = [...getDemoAnalyticsEvents(), ...readLocalAnalyticsEvents()];
    const localEvents = readLocalAnalyticsEvents();
    const end = new Date();
    end.setHours(24, 0, 0, 0);
    const start = getStartOfDay();
    start.setDate(start.getDate() - (period === 'seven_days' ? 6 : 0));
    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - (period === 'seven_days' ? 7 : 1));
    const previousEnd = new Date(start);
    const periodEvents = allEvents.filter((event) => isEventInRange(event, start, end));
    const previousEvents = allEvents.filter((event) => isEventInRange(event, previousStart, previousEnd));
    const current = selectMetrics(periodEvents);
    const previous = selectMetrics(previousEvents);

    const businessEvents = periodEvents.filter(isBusiness);
    const funnel = [
      { label: '进入工作台', count: setCount(businessEvents.filter((event) => event.module === 'workbench' && event.action === 'page_viewed')) },
      { label: '查看客户', count: setCount(businessEvents.filter((event) => event.action === 'client_opened')) },
      { label: '打开报价', count: setCount(businessEvents.filter((event) => event.action === 'quote_opened')) },
      { label: '生成 / 分享报价', count: setCount(businessEvents.filter((event) => event.action === 'quote_generated' || event.action === 'quote_shared')) },
    ];
    const ranking = featureDefinitions
      .map((feature) => ({
        ...feature,
        sessions: setCount(businessEvents.filter(feature.matches)),
        actions: businessEvents.filter(feature.matches).length,
      }))
      .sort((a, b) => b.actions - a.actions);

    const days = Array.from({ length: period === 'seven_days' ? 7 : 1 }, (_, index) => {
      const day = getStartOfDay();
      day.setDate(day.getDate() - (period === 'seven_days' ? 6 - index : 0));
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const daily = allEvents.filter((event) => isBusiness(event) && isEventInRange(event, day, nextDay));
      return {
        label: eventDateLabel(day),
        sessions: setCount(daily),
        actions: daily.filter((event) => keyActions.has(event.action)).length,
      };
    });

    const appCenterOpen = businessEvents.filter((event) => event.action === 'app_center_opened').length;
    const toolConfigured = businessEvents.filter((event) => event.action === 'tool_configured').length;
    const quoteOpened = businessEvents.filter((event) => event.action === 'quote_opened').length;
    const quoteShared = businessEvents.filter((event) => event.action === 'quote_shared').length;
    const autoExecuted = businessEvents.filter((event) => event.action === 'auto_transfer_executed').length;
    const personalized = businessEvents.filter((event) => event.action === 'layout_reordered' || event.action === 'tool_configured').length;

    const insights = [
      ...(appCenterOpen >= 8 && toolConfigured / appCenterOpen < 0.45 ? [{
        evidence: `应用中心打开 ${appCenterOpen} 次，工作必备配置仅 ${toolConfigured} 次`,
        impact: '高频能力被发现，但尚未沉淀为角色的日常入口。',
        recommendation: '把角色高频应用前置到工作必备，并在首次打开时给出一键添加。',
      }] : []),
      ...(quoteOpened >= 6 && quoteShared / quoteOpened < 0.6 ? [{
        evidence: `报价打开 ${quoteOpened} 次，分享动作 ${quoteShared} 次`,
        impact: '报价页承接有效，发给客户的最后一步仍有流失。',
        recommendation: '强化报价卡摘要和发送后的下一步提示，减少顾问离开页面后的中断。',
      }] : []),
      ...(current.autoTransferRate < 35 ? [{
        evidence: `自动转入采纳率 ${current.autoTransferRate}%；本期执行 ${autoExecuted} 次`,
        impact: '紧急队列的智能补位价值尚未被稳定感知。',
        recommendation: '在任务清空时先展示推荐依据，并允许一键撤回以建立信任。',
      }] : []),
    ].slice(0, 3);

    return { current, previous, funnel, ranking, days, insights, localEventCount: localEvents.length, personalized, autoExecuted };
  // `revision` intentionally re-evaluates localStorage after a real local action.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, revision]);

  const metrics: Metric[] = [
    {
      label: '活跃会话',
      value: `${dashboard.current.activeSessions}`,
      detail: '匿名体验会话',
      change: metricChange(dashboard.current.activeSessions, dashboard.previous.activeSessions),
      tone: 'blue',
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: '关键动作率',
      value: `${dashboard.current.keyActionRate}%`,
      detail: '会话完成关键动作',
      change: metricChange(dashboard.current.keyActionRate, dashboard.previous.keyActionRate),
      tone: 'emerald',
      icon: <Activity className="h-4 w-4" />,
    },
    {
      label: '工作台参与',
      value: `${dashboard.current.workbenchRate}%`,
      detail: '查看后继续操作',
      change: metricChange(dashboard.current.workbenchRate, dashboard.previous.workbenchRate),
      tone: 'indigo',
      icon: <LayoutPanelTop className="h-4 w-4" />,
    },
    {
      label: '智能补位采纳',
      value: `${dashboard.current.autoTransferRate}%`,
      detail: '开启或执行自动转入',
      change: metricChange(dashboard.current.autoTransferRate, dashboard.previous.autoTransferRate),
      tone: 'amber',
      icon: <Sparkles className="h-4 w-4" />,
    },
  ];

  const maximumTrend = Math.max(...dashboard.days.map((day) => Math.max(day.sessions, day.actions)), 1);
  const funnelMax = Math.max(dashboard.funnel[0]?.count || 1, 1);

  const changePeriod = (next: AnalyticsPeriod) => {
    setPeriod(next);
    onPeriodChanged(next);
  };

  const toggleSource = () => {
    const next = !isSourceOpen;
    setIsSourceOpen(next);
    if (next) onSourceExplained();
  };

  const reset = () => {
    onResetLocalData();
    setHasReset(true);
    window.setTimeout(() => setHasReset(false), 2200);
  };

  return (
    <div className="crm-page space-y-3.5 pb-7 select-none">
      <section className="rounded-2xl border border-[#dce9f7] bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_68%,#f1f7fe_100%)] p-4 shadow-[0_8px_24px_rgba(26,111,212,.07)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold tracking-[.16em] text-[#1a6fd4]">PRODUCT OPERATIONS</span>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">产品运营驾驶舱</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-[#5a6a88]">从真实体验行为识别下一项产品改进。</p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1a6fd4] text-white shadow-sm">
            <BarChart3 className="h-[18px] w-[18px]" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#e6eef8] pt-3">
          <button onClick={toggleSource} className="flex min-w-0 items-center gap-1.5 text-left text-[10px] font-medium text-[#5a6a88] cursor-pointer">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span className="truncate">演示基线 + 本机实时行为</span>
            <Info className="h-3.5 w-3.5 shrink-0 text-[#6f92bd]" />
          </button>
          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-[#1a6fd4]">本机 +{dashboard.localEventCount}</span>
        </div>
        {isSourceOpen && (
          <div className="mt-2.5 rounded-xl border border-[#dce9f7] bg-white/80 p-3 text-[10px] leading-relaxed text-[#5a6a88]">
            近 7 天基线为可重复演示数据；本机行为仅保存在当前浏览器。仅记录匿名会话、角色类型、模块和枚举动作，不采集客户、报价、搜索或小万对话内容。
          </div>
        )}
      </section>

      <div className="flex items-center justify-between border-b border-[#dce6f1] px-1">
        <div className="flex items-center gap-5">
          {([
            ['seven_days', '近 7 天'],
            ['today', '今日'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => changePeriod(value)}
              className={`relative pb-2.5 text-xs transition-colors cursor-pointer ${period === value ? 'font-bold text-[#1a6fd4]' : 'font-medium text-slate-400'}`}
            >
              {label}
              {period === value && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#1a6fd4]" />}
            </button>
          ))}
        </div>
        <button onClick={reset} className="mb-2 flex items-center gap-1 text-[10px] font-medium text-[#6a7b98] cursor-pointer hover:text-[#1a6fd4]">
          <RefreshCw className="h-3 w-3" />
          {hasReset ? '已重置' : '重置本机数据'}
        </button>
      </div>

      <section className="grid grid-cols-2 gap-2.5">
        {metrics.map((metric) => (
          <article key={metric.label} className="crm-card min-h-[116px] p-3.5">
            <div className="flex items-center justify-between">
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${metric.tone === 'blue' ? 'bg-blue-50 text-[#1a6fd4]' : metric.tone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : metric.tone === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>{metric.icon}</span>
              {metric.change !== null && (
                <span className={`flex items-center text-[10px] font-semibold ${metric.change >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {metric.change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(metric.change)}%
                </span>
              )}
            </div>
            <strong className="mt-3 block text-[22px] font-extrabold leading-none tracking-tight text-slate-900">{metric.value}</strong>
            <p className="mt-1.5 text-[10px] font-medium text-[#5a6a88]">{metric.label}</p>
            <p className="mt-0.5 text-[9px] text-slate-400">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="crm-card overflow-hidden">
        <div className="flex items-start justify-between px-4 pb-3 pt-4">
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-slate-900">业务行为漏斗</h3>
            <p className="mt-0.5 text-[10px] text-slate-400">行为代理指标，不代表真实成交</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium text-slate-500">匿名会话</span>
        </div>
        <div className="space-y-3 px-4 pb-4">
          {dashboard.funnel.map((step, index) => {
            const previousCount = index ? dashboard.funnel[index - 1].count : step.count;
            const width = Math.max(9, Math.round((step.count / funnelMax) * 100));
            return (
              <div key={step.label} className="grid grid-cols-[96px_1fr_32px] items-center gap-2">
                <span className="truncate text-[11px] font-medium text-[#455775]">{step.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-[#edf3f9]">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#1a6fd4,#5e9ee6)]" style={{ width: `${width}%` }} />
                </div>
                <span className="text-right text-[11px] font-bold text-slate-800">{index ? `${percent(step.count, previousCount)}%` : step.count}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="crm-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-slate-900">使用趋势</h3>
            <p className="mt-0.5 text-[10px] text-slate-400">活跃会话与关键动作</p>
          </div>
          <span className="text-[10px] font-medium text-[#6a7b98]">{period === 'seven_days' ? '近 7 日' : '今日'}</span>
        </div>
        <div className="mt-4 flex h-28 items-end gap-2">
          {dashboard.days.map((day) => (
            <div key={day.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
              <div className="flex h-[76px] w-full items-end justify-center gap-1">
                <span className="w-[38%] rounded-t-[4px] bg-[#bed8f4]" style={{ height: `${Math.max(7, (day.sessions / maximumTrend) * 76)}px` }} />
                <span className="w-[38%] rounded-t-[4px] bg-[#1a6fd4]" style={{ height: `${Math.max(day.actions ? 7 : 2, (day.actions / maximumTrend) * 76)}px` }} />
              </div>
              <span className="text-[9px] text-slate-400">{day.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-3 text-[9px] text-slate-400">
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#bed8f4]" />活跃会话</span>
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#1a6fd4]" />关键动作</span>
        </div>
      </section>

      <section className="crm-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-slate-900">功能采用排行</h3>
            <p className="mt-0.5 text-[10px] text-slate-400">按业务动作量排序</p>
          </div>
          <span className="text-[10px] font-medium text-[#6a7b98]">{dashboard.personalized} 次个性化配置</span>
        </div>
        <div className="mt-4 space-y-2.5">
          {dashboard.ranking.map((feature, index) => (
            <div key={feature.label} className="grid grid-cols-[16px_76px_1fr_30px] items-center gap-2">
              <span className="text-[10px] font-bold text-[#8a9ab8]">{index + 1}</span>
              <span className="truncate text-[11px] font-medium text-[#455775]">{feature.label}</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#edf3f9]"><div className={`h-full rounded-full ${feature.tone}`} style={{ width: `${Math.max(5, percent(feature.actions, dashboard.ranking[0]?.actions || 1))}%` }} /></div>
              <span className="text-right text-[10px] font-semibold text-slate-600">{feature.actions}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h3 className="text-sm font-extrabold tracking-tight text-slate-900">运营结论</h3>
            <p className="mt-0.5 text-[10px] text-slate-400">数据证据 → 影响 → 建议迭代</p>
          </div>
          <BrainCircuit className="h-4 w-4 text-[#1a6fd4]" />
        </div>
        {dashboard.insights.map((insight, index) => (
          <article key={insight.evidence} className="crm-card border-l-[3px] border-l-[#1a6fd4] p-3.5">
            <span className="text-[10px] font-bold text-[#1a6fd4]">0{index + 1} / 证据</span>
            <p className="mt-1 text-[12px] font-bold leading-relaxed text-slate-800">{insight.evidence}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-[#5a6a88]">{insight.impact}</p>
            <div className="mt-2.5 flex items-start gap-1 text-[10px] font-medium leading-relaxed text-[#1a6fd4]">
              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0" />
              {insight.recommendation}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};
