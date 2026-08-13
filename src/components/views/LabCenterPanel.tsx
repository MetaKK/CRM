import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CirclePlay,
  Code2,
  FlaskConical,
  ShieldCheck,
  ThumbsUp,
  X,
} from 'lucide-react';
import { FrontlineLabTool } from '../../types';
import { getAppToolIcon } from '../appTools';

interface LabCenterPanelProps {
  tools: FrontlineLabTool[];
  supportedToolIds: string[];
  onToggleSupport: (tool: FrontlineLabTool, nextSupported: boolean) => void;
  onToolViewed: (tool: FrontlineLabTool) => void;
  onToolLaunched: (tool: FrontlineLabTool) => void;
  onTutorialOpened: () => void;
  onSubmissionStarted: () => void;
}

const LabBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold tracking-[0.08em] text-[#1a6fd4]">
    <FlaskConical className="h-3 w-3" /> LAB
  </span>
);

export const LabCenterPanel: React.FC<LabCenterPanelProps> = ({
  tools,
  supportedToolIds,
  onToggleSupport,
  onToolViewed,
  onToolLaunched,
  onTutorialOpened,
  onSubmissionStarted,
}) => {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [hasStartedSubmission, setHasStartedSubmission] = useState(false);
  const [trialledToolId, setTrialledToolId] = useState<string | null>(null);

  const selectedTool = useMemo(() => tools.find((tool) => tool.id === selectedToolId), [selectedToolId, tools]);

  const openTool = (tool: FrontlineLabTool) => {
    setSelectedToolId(tool.id);
    setTrialledToolId(null);
    onToolViewed(tool);
  };

  const openTutorial = () => {
    setIsTutorialOpen(true);
    onTutorialOpened();
  };

  const openSubmission = () => {
    setIsTutorialOpen(false);
    setIsSubmissionOpen(true);
  };

  const startSubmission = () => {
    if (!hasStartedSubmission) onSubmissionStarted();
    setHasStartedSubmission(true);
  };

  if (selectedTool) {
    const Icon = getAppToolIcon(selectedTool.iconName);
    const isSupported = supportedToolIds.includes(selectedTool.id);
    const currentSupport = selectedTool.supportCount + (isSupported ? 1 : 0);
    return (
      <section className="bg-white px-4 pb-8 pt-4">
        <button type="button" onClick={() => setSelectedToolId(null)} className="flex min-h-9 items-center gap-1 text-[11px] font-semibold text-[#1a6fd4] cursor-pointer">
          <ArrowLeft className="h-4 w-4" />返回一线 Lab
        </button>
        <article className="crm-card mt-3 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#dce9f7] bg-[#f4f9ff] text-[#1a6fd4]"><Icon className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <LabBadge />
              <h3 className="mt-2 text-[17px] font-extrabold tracking-tight text-[#1a2438]">{selectedTool.name}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-[#5a6a88]">{selectedTool.desc}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 border-y border-[#eaf0f7] py-3 text-center">
            <div><strong className="text-[15px] text-[#1a2438]">{currentSupport}</strong><span className="mt-1 block text-[9px] text-[#8a9ab8]">员工支持</span></div>
            <div><strong className="text-[12px] text-[#1a2438]">{selectedTool.stabilityLabel}</strong><span className="mt-1 block text-[9px] text-[#8a9ab8]">运行观察</span></div>
          </div>
          <div className="mt-3 rounded-xl border border-[#eaf0f7] bg-[#f8fbff] p-3 text-[10px] leading-relaxed text-[#5a6a88]">
            <strong className="text-[#3a4a68]">来自 {selectedTool.submittedBy}</strong> · {selectedTool.submittedRole}<br />适用场景：{selectedTool.scenario}
          </div>
          <p className="mt-3 flex gap-1.5 text-[9px] leading-relaxed text-[#8a9ab8]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1a6fd4]" />实验工具可能暂停维护，不能处理客户敏感数据，也不代表已获正式应用支持。</p>
          {trialledToolId === selectedTool.id && <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-[10px] font-medium text-[#1a6fd4]">已进入体验模式（演示）：请在真实提交前完成数据与权限自检。</p>}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onToggleSupport(selectedTool, !isSupported)} aria-pressed={isSupported} className={`flex h-10 items-center justify-center gap-1 rounded-lg border text-[12px] font-semibold transition-colors cursor-pointer ${isSupported ? 'border-blue-100 bg-blue-50 text-[#1a6fd4]' : 'border-[#1a6fd4] bg-white text-[#1a6fd4] hover:bg-blue-50'}`}><ThumbsUp className="h-3.5 w-3.5" />{isSupported ? '已支持' : '支持工具'}</button>
            <button type="button" onClick={() => { setTrialledToolId(selectedTool.id); onToolLaunched(selectedTool); }} className="flex h-10 items-center justify-center gap-1 rounded-lg bg-[#1a6fd4] text-[12px] font-semibold text-white transition-colors hover:bg-[#155caf] cursor-pointer">试用 Lab 工具<ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </article>
      </section>
    );
  }

  return (
    <>
      <section className="bg-white px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><div className="flex items-center gap-2"><h2 className="text-[18px] font-extrabold tracking-tight text-[#1a2438]">一线 Lab</h2><LabBadge /></div><p className="mt-1 text-[10px] leading-relaxed text-[#5a6a88]">把一线工作方法做成小工具，先在可控范围验证，再决定是否进入日常应用。</p></div>
          <button type="button" onClick={openSubmission} className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[#1a6fd4] px-2 text-[10px] font-semibold text-[#1a6fd4] hover:bg-blue-50 cursor-pointer"><Code2 className="h-3.5 w-3.5" />提交工具</button>
        </div>
        <div className="mt-3 rounded-xl border border-[#dce9f7] bg-[#f8fbff] px-3 py-2.5 text-[9px] leading-relaxed text-[#5a6a88]"><strong className="text-[#1a6fd4]">晋级路径：</strong>员工支持 ≥300、连续 14 天稳定运行、通过代码与数据安全审核后，才进入常规应用评估。点赞不等同审批。</div>
      </section>

      <section className="bg-white px-4 pt-3">
        <button type="button" onClick={openTutorial} className="relative w-full overflow-hidden rounded-xl border border-[#dce9f7] bg-[linear-gradient(135deg,#174d91_0%,#1a6fd4_52%,#7eb6f2_100%)] p-3 text-left text-white shadow-[0_4px_14px_rgba(26,111,212,.16)] cursor-pointer">
          <span className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:18px_18px]" />
          <span className="relative flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/18"><CirclePlay className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="text-[9px] font-semibold text-blue-100">视频教程 · YouTube 风格演示 · 08:42</span><strong className="mt-1 block text-[12px] leading-snug">业务人员如何用 Vibe Coding 做出第一个工作工具</strong><span className="mt-1 block text-[9px] text-blue-100">从岗位痛点到代码审核提交，一次看懂。</span></span><ChevronRight className="h-4 w-4 shrink-0 text-white/90" /></span>
        </button>
      </section>

      <section className="bg-white px-4 pb-8 pt-4">
        <div className="mb-2 flex items-center justify-between"><h3 className="text-[13px] font-bold text-[#1a2438]">员工共创工具</h3><span className="text-[9px] text-[#8a9ab8]">{tools.length} 个实验应用</span></div>
        <div className="divide-y divide-[#eaf0f7]">{tools.map((tool) => {
          const Icon = getAppToolIcon(tool.iconName);
          const isSupported = supportedToolIds.includes(tool.id);
          const currentSupport = tool.supportCount + (isSupported ? 1 : 0);
          return <article key={tool.id} className="flex min-h-[92px] items-center gap-3 py-3"><button type="button" onClick={() => openTool(tool)} className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#dce9f7] bg-[#f4f9ff] text-[#1a6fd4]"><Icon className="h-5 w-5" /></span><span className="min-w-0"><span className="flex items-center gap-1.5"><LabBadge /><strong className="truncate text-[13px] text-[#1a2438]">{tool.name}</strong></span><span className="mt-1 block truncate text-[10px] text-[#5a6a88]">{tool.scenario} · {tool.submittedRole}</span><span className="mt-1 block text-[9px] text-[#8a9ab8]">{tool.stage} · {tool.stabilityLabel}</span></span></button><button type="button" onClick={() => onToggleSupport(tool, !isSupported)} aria-label={`${isSupported ? '取消支持' : '支持'}${tool.name}`} aria-pressed={isSupported} className={`flex min-h-9 shrink-0 flex-col items-center justify-center rounded-lg px-2 text-[9px] font-semibold transition-colors cursor-pointer ${isSupported ? 'bg-blue-50 text-[#1a6fd4]' : 'text-[#6a7b98] hover:bg-blue-50 hover:text-[#1a6fd4]'}`}><ThumbsUp className="h-3.5 w-3.5" /><span className="mt-0.5">{currentSupport}</span></button></article>;
        })}</div>
      </section>

      {isTutorialOpen && <div className="fixed inset-0 z-50 flex items-end bg-[#1a2438]/35" role="dialog" aria-modal="true" aria-label="Vibe Coding 教程"><section className="max-h-[88dvh] w-full overflow-y-auto rounded-t-[20px] bg-white px-4 pb-safe pt-4 shadow-[0_-12px_30px_rgba(26,36,56,.16)]"><div className="flex items-center justify-between"><div><LabBadge /><h3 className="mt-2 text-[17px] font-extrabold text-[#1a2438]">从岗位痛点到可审核代码</h3></div><button type="button" onClick={() => setIsTutorialOpen(false)} aria-label="关闭教程" className="flex h-9 w-9 items-center justify-center rounded-xl text-[#5a6a88] hover:bg-blue-50 cursor-pointer"><X className="h-5 w-5" /></button></div><div className="mt-4 space-y-2.5">{['先写清一个岗位痛点和可验证结果，不从“做大系统”开始。', '用 Vibe Coding 把流程拆成最小工具：输入、规则、输出与边界。', '仅用脱敏样例测试；不要把客户、报价或对话原文交给实验工具。', '提交代码审核时附上仓库链接、使用说明、权限范围、测试证据和回退方案。'].map((item, index) => <div key={item} className="flex gap-3 rounded-xl border border-[#eaf0f7] bg-[#f8fbff] p-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[9px] font-bold text-[#1a6fd4]">{index + 1}</span><p className="text-[11px] leading-relaxed text-[#5a6a88]">{item}</p></div>)}</div><button type="button" onClick={openSubmission} className="mt-4 flex h-10 w-full items-center justify-center gap-1 rounded-lg bg-[#1a6fd4] text-[12px] font-semibold text-white hover:bg-[#155caf] cursor-pointer">查看代码审核清单<ChevronRight className="h-3.5 w-3.5" /></button></section></div>}

      {isSubmissionOpen && <div className="fixed inset-0 z-50 flex items-end bg-[#1a2438]/35" role="dialog" aria-modal="true" aria-label="代码审核提交说明"><section className="max-h-[88dvh] w-full overflow-y-auto rounded-t-[20px] bg-white px-4 pb-safe pt-4 shadow-[0_-12px_30px_rgba(26,36,56,.16)]"><div className="flex items-center justify-between"><div><LabBadge /><h3 className="mt-2 text-[17px] font-extrabold text-[#1a2438]">提交代码审核</h3></div><button type="button" onClick={() => setIsSubmissionOpen(false)} aria-label="关闭代码审核说明" className="flex h-9 w-9 items-center justify-center rounded-xl text-[#5a6a88] hover:bg-blue-50 cursor-pointer"><X className="h-5 w-5" /></button></div>{hasStartedSubmission ? <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-[11px] leading-relaxed text-[#1a6fd4]"><Check className="mr-1 inline h-4 w-4" />已记录你的审核发起意图（演示）。真实流程请创建代码审查工单，并附上以下完整材料。</div> : <><p className="mt-3 text-[11px] leading-relaxed text-[#5a6a88]">Lab 只接收可复现、可审查的小工具。提交前请确认：</p><div className="mt-3 space-y-2.5">{['可访问的代码仓库或变更链接', '业务目标、目标使用者和操作说明', '数据与权限说明：不含客户敏感数据、最小权限', '测试证据、已知限制和一键回退方案'].map((item) => <div key={item} className="flex items-center gap-2 rounded-xl border border-[#eaf0f7] px-3 py-2.5 text-[11px] text-[#5a6a88]"><Check className="h-4 w-4 shrink-0 text-[#1a6fd4]" />{item}</div>)}</div><button type="button" onClick={startSubmission} className="mt-4 flex h-10 w-full items-center justify-center rounded-lg bg-[#1a6fd4] text-[12px] font-semibold text-white hover:bg-[#155caf] cursor-pointer">我已准备好，发起审核</button><p className="mt-2 text-center text-[9px] leading-relaxed text-[#8a9ab8]">演示环境只记录发起意图，不会上传代码或业务数据。</p></>}</section></div>}
    </>
  );
};
