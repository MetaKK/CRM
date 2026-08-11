import React, { useState } from 'react';
import {
  Calculator,
  Car,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  PhoneCall,
  QrCode,
  Send,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { mockClients, mockTestDrives, mockVehicles } from '../../data/mockData';
import { ClientRecord, RoleAccount, TabType } from '../../types';

interface WorkbenchViewProps {
  onNavigateToTab: (tab: TabType) => void;
  onOpenAppCenter: () => void;
  onSelectClient: (client: ClientRecord) => void;
  onOpenQuoteBuilder: (client: ClientRecord) => void;
  currentAccount: RoleAccount;
}

const pipelineSteps: Array<{ id: string; label: string; count: number; tab: TabType }> = [
  { id: 'leads', label: '潜客', count: 28, tab: 'clients' },
  { id: 'followup', label: '跟进中', count: 14, tab: 'clients' },
  { id: 'testdrive', label: '试驾', count: 6, tab: 'testdrive' },
  { id: 'quote', label: '待报价', count: 5, tab: 'clients' },
  { id: 'order', label: '大定', count: 3, tab: 'orders' },
  { id: 'delivery', label: '交付', count: 2, tab: 'orders' },
];

export const WorkbenchView: React.FC<WorkbenchViewProps> = ({
  onNavigateToTab,
  onOpenAppCenter,
  onSelectClient,
  onOpenQuoteBuilder,
  currentAccount,
}) => {
  const [activePipelineStage, setActivePipelineStage] = useState('leads');
  const [activeMetric, setActiveMetric] = useState('线索');
  const [nextTaskStatus, setNextTaskStatus] = useState<'ready' | 'received'>('ready');
  const urgentLeads = mockClients.filter((client) => client.slaStatus === 'warning' || client.slaStatus === 'overdue');
  const nextDrive = mockTestDrives[0];

  const taskActions = [
    { label: '首次跟进', icon: PhoneCall, value: 5 },
    { label: 'PDC 任务', icon: CheckSquare, value: 2 },
    { label: '试驾跟进', icon: Car, value: 3 },
    { label: '大定任务', icon: FileText, value: 1 },
  ];

  return (
    <main className="crm-page space-y-3.5 select-none">
      <section className="crm-card">
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex gap-6">
            {['线索', '试驾', '订单'].map((item) => {
              const isActive = activeMetric === item;
              return (
                <button
                  key={item}
                  onClick={() => setActiveMetric(item)}
                  className={`relative pb-2.5 text-[16px] transition-colors cursor-pointer ${
                    isActive ? 'text-[#1a6fd4] font-bold' : 'text-slate-400 font-medium'
                  }`}
                >
                  {item}
                  {isActive && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#1a6fd4]" />}
                </button>
              );
            })}
          </div>
          <button className="flex items-center gap-0.5 text-[13px] text-slate-400 cursor-pointer">
            今日 <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1 px-4 py-4">
          {currentAccount.workbenchMetrics.slice(0, 4).map((metric) => (
            <button
              key={metric.label}
              onClick={() => metric.targetTab && onNavigateToTab(metric.targetTab)}
              className="min-w-0 text-center cursor-pointer active:scale-95 transition-transform"
            >
              <span className="block truncate text-[12px] text-slate-400">{metric.label}</span>
              <strong className="mt-1.5 block text-[26px] leading-none font-bold text-slate-900">{metric.value}</strong>
            </button>
          ))}
        </div>

        <button
          onClick={() => onNavigateToTab(activeMetric === '试驾' ? 'testdrive' : activeMetric === '订单' ? 'orders' : 'clients')}
          className="w-full border-t border-[#f0f3f9] py-2.5 text-[13px] text-slate-500 cursor-pointer hover:text-[#1a6fd4]"
        >
          查看全部数据 <span className="ml-0.5 text-[#1a6fd4]">›</span>
        </button>
      </section>

      <section className="crm-card">
        <div className="flex items-center justify-between px-5 pt-[18px] pb-3.5">
          <div>
            <h2 className="text-[18px] font-bold text-slate-900">今日待办</h2>
            <p className="mt-0.5 text-[12px] text-slate-400">{currentAccount.workbenchTitle} · 工作节奏总览</p>
          </div>
          <button
            onClick={() => onNavigateToTab('testdrive')}
            className="text-[14px] font-medium text-[#1a6fd4] cursor-pointer"
          >
            查看任务
          </button>
        </div>

        <div className="px-5 pb-4">
          <div className="flex items-center gap-3 border-b border-[#f0f3f9] pb-4">
            <svg className="shrink-0" width="76" height="76" viewBox="0 0 76 76" aria-label="任务完成进度">
              <circle cx="38" cy="38" r="30" fill="none" stroke="#ddeeff" strokeWidth="7" />
              <circle
                cx="38"
                cy="38"
                r="30"
                fill="none"
                stroke="#1a6fd4"
                strokeWidth="7"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * 0.7}`}
                strokeLinecap="round"
                transform="rotate(-90 38 38)"
              />
              <text x="38" y="43" textAnchor="middle" fill="#1a6fd4" fontSize="14" fontWeight="700">30%</text>
            </svg>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-700">
                <CheckSquare className="h-4.5 w-4.5 text-slate-600" /> 任务总量
              </div>
              <div className="mt-2 flex gap-9">
                <div>
                  <strong className="text-[28px] leading-none text-slate-900">{taskActions.reduce((total, task) => total + task.value, 0)}</strong>
                  <span className="mt-1 block text-[12px] text-slate-400">待完成</span>
                </div>
                <div>
                  <strong className="text-[28px] leading-none text-slate-900">4</strong>
                  <span className="mt-1 block text-[12px] text-slate-400">已完成</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2">
          {taskActions.map((task, index) => {
            const Icon = task.icon;
            return (
              <button
                key={task.label}
                onClick={() => onNavigateToTab(task.label === '试驾跟进' ? 'testdrive' : 'clients')}
                className={`p-4 text-left cursor-pointer hover:bg-blue-50/40 transition-colors ${
                  index % 2 === 0 ? 'border-r border-[#f0f3f9]' : ''
                } ${index < 2 ? 'border-b border-[#f0f3f9]' : ''}`}
              >
                <span className="flex items-center gap-2 text-[14px] font-medium text-slate-700">
                  <Icon className="h-[18px] w-[18px] text-slate-600" /> {task.label}
                </span>
                <span className="mt-3 block h-[3px] rounded-full bg-[linear-gradient(90deg,#1a6fd4_0%,#c8daf5_60%,#edf2fb_100%)]" />
                <span className="mt-2 block text-[12px] text-slate-400"><b className="text-[15px] text-slate-900">{task.value}</b> 待完成</span>
              </button>
            );
          })}
        </div>
      </section>

      {urgentLeads.length > 0 && (
        <section className="crm-card border-rose-100">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2 text-[14px] font-bold text-slate-800">
              <span className="h-2 w-2 rounded-full bg-[#e84040] animate-pulse" />
              优先跟进
            </div>
            <span className="text-[12px] text-[#e84040]">{urgentLeads.length} 位待处理</span>
          </div>
          <div className="px-4 pb-3 space-y-2">
            {urgentLeads.slice(0, 2).map((lead) => (
              <div key={lead.id} className="crm-card-subtle flex items-center justify-between gap-2 p-3 bg-[#fffafb]">
                <button onClick={() => onSelectClient(lead)} className="min-w-0 text-left cursor-pointer">
                  <strong className="block truncate text-[13px] text-slate-900">{lead.name} · {lead.intentCar}</strong>
                  <span className="mt-1 block truncate text-[11px] text-slate-500">{lead.channelOrigin.campaign} · 需要尽快响应</span>
                </button>
                <div className="flex shrink-0 gap-1.5">
                  <a
                    href={`https://wa.me/${lead.countryCode}${lead.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-blue-100 bg-white p-2 text-[#1a6fd4]"
                    aria-label={`联系 ${lead.name}`}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </a>
                  <a href={`tel:${lead.phone}`} className="rounded-lg bg-[#1a6fd4] p-2 text-white" aria-label={`拨打 ${lead.name}`}>
                    <PhoneCall className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="crm-card">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#1a6fd4]"><Zap className="h-4 w-4" /></span>
            <div>
              <h2 className="text-[16px] font-bold text-slate-900">下一步最佳行动</h2>
              <p className="text-[11px] text-slate-400">系统按客户意向与时间优先级排序</p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400">距开始 28 min</span>
        </div>

        <div className="mx-4 rounded-xl border border-[#dceaf9] bg-[#f8fbff] p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-[14px] font-bold text-slate-900">{nextDrive.timeSlot} {nextDrive.clientName} · 预约试驾</h3>
              <p className="mt-1 truncate text-[12px] text-slate-600">试驾车型：{nextDrive.carModel}</p>
            </div>
            <span className="shrink-0 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-semibold text-[#1a6fd4]">{nextDrive.status}</span>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setNextTaskStatus('received')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[12px] font-semibold text-white cursor-pointer ${
                nextTaskStatus === 'received' ? 'bg-emerald-600' : 'bg-[#1a6fd4] hover:bg-[#155caf]'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" /> {nextTaskStatus === 'received' ? '试驾接待中' : '开始试驾接待'}
            </button>
            <button onClick={() => onNavigateToTab('testdrive')} className="rounded-lg border border-[#c6def8] bg-white px-3 text-[12px] font-semibold text-[#1a6fd4] cursor-pointer">
              查看排期
            </button>
          </div>
        </div>

        <div className="px-4 py-3">
          {mockTestDrives.slice(1, 3).map((drive) => (
            <button key={drive.id} onClick={() => onNavigateToTab('testdrive')} className="flex w-full items-center justify-between py-2 text-left cursor-pointer border-b last:border-0 border-[#f0f3f9]">
              <span className="flex min-w-0 items-center gap-2"><Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" /><b className="shrink-0 text-[12px] text-slate-700">{drive.timeSlot}</b><span className="truncate text-[12px] text-slate-500">{drive.clientName} · {drive.carModel}</span></span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#1a6fd4]" />
            </button>
          ))}
        </div>
      </section>

      <section className="crm-card">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">转化进度</h2>
            <p className="mt-0.5 text-[11px] text-slate-400">点击阶段快速进入客户筛选</p>
          </div>
          <Sparkles className="h-4 w-4 text-[#1a6fd4]" />
        </div>
        <div className="grid grid-cols-3 gap-px border-y border-[#eef3f9] bg-[#eef3f9]">
          {pipelineSteps.map((step) => {
            const selected = activePipelineStage === step.id;
            return (
              <button
                key={step.id}
                onClick={() => { setActivePipelineStage(step.id); onNavigateToTab(step.tab); }}
                className={`bg-white px-2 py-3 text-center cursor-pointer transition-colors ${selected ? 'bg-[#f7fbff]' : 'hover:bg-[#f7fbff]'}`}
              >
                <span className={`block text-[11px] ${selected ? 'font-semibold text-[#1a6fd4]' : 'text-slate-500'}`}>{step.label}</span>
                <strong className="mt-1 block text-[20px] leading-none text-slate-900">{step.count}</strong>
              </button>
            );
          })}
        </div>
        <button onClick={() => onNavigateToTab('clients')} className="flex w-full items-center justify-between px-5 py-3 text-left cursor-pointer">
          <span className="text-[12px] text-slate-500">5 位客户已达到报价节点，建议今日推进</span>
          <span className="shrink-0 text-[12px] font-medium text-[#1a6fd4]">一键跟进</span>
        </button>
      </section>

      <section className="crm-card">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h2 className="text-[16px] font-bold text-slate-900">常用工具</h2>
          <button onClick={onOpenAppCenter} className="flex items-center text-[13px] text-[#1a6fd4] cursor-pointer">全部应用 <ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-4 border-t border-[#f0f3f9]">
          {[
            { label: '开立报价', icon: Calculator, action: () => onOpenQuoteBuilder(mockClients[0]) },
            { label: '预约试驾', icon: Car, action: () => onNavigateToTab('testdrive') },
            { label: '客户 360', icon: Users, action: () => onNavigateToTab('clients') },
            { label: 'VIN 雷达', icon: QrCode, action: onOpenAppCenter },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <button key={tool.label} onClick={tool.action} className="flex flex-col items-center gap-2 py-4 cursor-pointer hover:bg-blue-50/40">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1a6fd4]"><Icon className="h-5 w-5" /></span>
                <span className="text-[11px] font-medium text-slate-700 whitespace-nowrap">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="crm-card">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2"><Car className="h-4 w-4 text-[#1a6fd4]" /><h2 className="text-[16px] font-bold text-slate-900">成交资源</h2></div>
          <span className="text-[11px] text-slate-400">DMS 实时</span>
        </div>
        <div className="space-y-2 px-4 pb-4">
          {mockVehicles.map((vehicle) => (
            <div key={vehicle.vin} className="crm-card-subtle p-3">
              <div className="flex items-center justify-between gap-2"><strong className="truncate text-[12px] text-slate-900">{vehicle.modelName}</strong><span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-[#1a6fd4]">{vehicle.locationStatus}</span></div>
              <p className="mt-1 truncate text-[11px] text-slate-600">{vehicle.configTrim} · {vehicle.colorExterior}/{vehicle.colorInterior}</p>
              <div className="mt-1 flex justify-between gap-2 text-[10px] text-slate-400"><span className="truncate">{vehicle.vin}</span><b className="shrink-0 text-slate-700">{vehicle.currency}{vehicle.msrp.toLocaleString()}</b></div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
