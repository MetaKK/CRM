import React, { useEffect, useState } from 'react';
import {
  X,
  Calculator,
  ChevronRight,
  Sparkles,
  Share2,
  Check,
  Plus,
} from 'lucide-react';
import { AppTool } from '../../types';
import { MAX_QUICK_TOOLS } from '../../lib/workbenchPreferences';
import { getAppToolIcon } from '../appTools';

interface AppCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisorName: string;
  storeName: string;
  phone: string;
  roleTitle: string;
  tools: AppTool[];
  pinnedToolIds: string[];
  initialToolId?: string | null;
  onTogglePinnedTool: (toolId: string) => void;
  onLaunchTool: (tool: AppTool) => void;
}

export const AppCenterModal: React.FC<AppCenterModalProps> = ({
  isOpen,
  onClose,
  advisorName,
  storeName,
  phone,
  roleTitle,
  tools,
  pinnedToolIds,
  initialToolId,
  onTogglePinnedTool,
  onLaunchTool,
}) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setActiveTool(initialToolId || null);
  }, [initialToolId, isOpen]);

  // Calculator State
  const [carPrice, setCarPrice] = useState<number>(189800);
  const [downPaymentRatio, setDownPaymentRatio] = useState<number>(30);
  const [loanYears, setLoanYears] = useState<number>(3);

  if (!isOpen) return null;

  // Calculation Logic
  const downPayment = Math.round(carPrice * (downPaymentRatio / 100));
  const loanAmount = carPrice - downPayment;
  const annualRate = 0.045; // 4.5% rate
  const totalMonths = loanYears * 12;
  const monthlyPayment = Math.round(
    (loanAmount * (1 + annualRate * loanYears)) / totalMonths
  );
  const purchaseTax = Math.round(carPrice / 11.3); // estimated
  const insurance = 5500;
  const totalOnRoad = downPayment + purchaseTax + insurance;

  const selectedTool = tools.find((tool) => tool.id === activeTool);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 select-none">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">应用中心</h3>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full border border-blue-100">
                {roleTitle}可用
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">选择常用应用，工作台最多保留 {MAX_QUICK_TOOLS} 个</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-3 overflow-y-auto space-y-4 my-1 flex-1">
          {/* Tool Grid */}
          {!activeTool ? (
            <div className="grid grid-cols-2 gap-3">
              {tools.map((tool: AppTool) => {
                const Icon = getAppToolIcon(tool.iconName);
                const isPinned = pinnedToolIds.includes(tool.id);
                const isAtLimit = !isPinned && pinnedToolIds.length >= MAX_QUICK_TOOLS;

                return (
                <div
                  key={tool.id}
                  onClick={() => {
                    if (tool.targetTab) {
                      onLaunchTool(tool);
                      onClose();
                      return;
                    }
                    setActiveTool(tool.id);
                  }}
                  className="p-4 rounded-2xl bg-gray-50/80 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-11 h-11 rounded-xl bg-blue-50 text-[#1a6fd4] flex items-center justify-center group-hover:scale-105 transition-transform"
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!isAtLimit) onTogglePinnedTool(tool.id);
                      }}
                      aria-label={isPinned ? `从常用工具移除${tool.name}` : `添加${tool.name}到常用工具`}
                      aria-pressed={isPinned}
                      disabled={isAtLimit}
                      className={`flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg border px-1.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                        isPinned
                          ? 'border-blue-100 bg-blue-50 text-[#1a6fd4]'
                          : isAtLimit
                            ? 'border-gray-100 bg-white text-gray-300 cursor-not-allowed'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-blue-200 hover:text-[#1a6fd4]'
                      }`}
                    >
                      {isPinned ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      <span>{isPinned ? '常用' : '添加'}</span>
                    </button>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                      {tool.name}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-tight">
                      {tool.desc}
                    </p>
                  </div>
                </div>
                );
              })}
            </div>
          ) : activeTool === 'calc' ? (
            /* Sub-tool 1: Car Price Loan Calculator */
            <div className="space-y-4">
              <button
                onClick={() => setActiveTool(null)}
                className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline cursor-pointer"
              >
                ← 返回应用中心
              </button>

              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between text-xs text-blue-100 font-medium">
                  <span>预估月供 (分期 {loanYears} 年)</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full">年利率 4.5%</span>
                </div>
                <div className="text-3xl font-bold mt-1 tracking-tight">
                  ¥ {monthlyPayment.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-blue-200">/ 月</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/20 text-xs">
                  <div>
                    <span className="text-blue-200 block text-[10px]">首付款 ({downPaymentRatio}%)</span>
                    <span className="font-bold text-sm">¥ {(downPayment / 10000).toFixed(2)}万</span>
                  </div>
                  <div>
                    <span className="text-blue-200 block text-[10px]">贷款额度</span>
                    <span className="font-bold text-sm">¥ {(loanAmount / 10000).toFixed(2)}万</span>
                  </div>
                  <div>
                    <span className="text-blue-200 block text-[10px]">首期落地预估</span>
                    <span className="font-bold text-sm">¥ {(totalOnRoad / 10000).toFixed(2)}万</span>
                  </div>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <label className="text-xs font-bold text-gray-700 flex justify-between">
                    <span>车辆指导价 (元)</span>
                    <span className="text-blue-600 font-extrabold">
                      ¥ {carPrice.toLocaleString()}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="80000"
                    max="500000"
                    step="5000"
                    value={carPrice}
                    onChange={(e) => setCarPrice(Number(e.target.value))}
                    className="w-full mt-2 accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    首付比例: {downPaymentRatio}%
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 20, 30, 50].map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setDownPaymentRatio(ratio)}
                        className={`py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                          downPaymentRatio === ratio
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {ratio}%
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    按揭期限: {loanYears}年 ({loanYears * 12}期)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 3, 5].map((years) => (
                      <button
                        key={years}
                        onClick={() => setLoanYears(years)}
                        className={`py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                          loanYears === years
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {years}年
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => alert(`已成功生成购车报价单明细，可直接通过微信发送给客户！`)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Share2 className="w-4 h-4" />
                生成报价微信分享卡片
              </button>
            </div>
          ) : activeTool === 'catalog' ? (
            /* Sub-tool 2: Car Showcase */
            <div className="space-y-3">
              <button
                onClick={() => setActiveTool(null)}
                className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline cursor-pointer"
              >
                ← 返回应用中心
              </button>

              <div className="space-y-3">
                {[
                  {
                    name: 'iCAR 03 纯电潮玩SUV',
                    price: '10.98 - 16.98 万元',
                    tag: '爆款首选 · 智驾四驱',
                    bg: 'from-blue-500 to-cyan-600',
                  },
                  {
                    name: '星纪元 ES 纯电轿跑',
                    price: '19.88 - 29.98 万元',
                    tag: '800V高压超充 · 空气悬架',
                    bg: 'from-indigo-600 to-purple-700',
                  },
                  {
                    name: '瑞虎 9 旗舰中型SUV',
                    price: '15.29 - 20.99 万元',
                    tag: 'CDC磁悬浮底盘 · 2.0T强劲动力',
                    bg: 'from-slate-700 to-slate-900',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`bg-gradient-to-r ${item.bg} text-white p-4 rounded-2xl shadow-sm flex flex-col justify-between`}
                  >
                    <div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                        {item.tag}
                      </span>
                      <h4 className="font-bold text-base mt-1">{item.name}</h4>
                      <p className="text-xs text-white/80 font-medium">官方指导价: {item.price}</p>
                    </div>
                    <button
                      onClick={() => alert(`已准备好 ${item.name} 的高精彩页与试驾预约入口`)}
                      className="mt-3 py-1.5 px-3 bg-white text-gray-900 font-bold text-xs rounded-xl self-end cursor-pointer hover:bg-gray-100"
                    >
                      发送客户看车
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Generic Tool Placeholder */
            <div className="space-y-3 text-center py-6">
              <button
                onClick={() => setActiveTool(null)}
                className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline cursor-pointer mx-auto"
              >
                ← 返回应用中心
              </button>
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto my-3">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <h4 className="font-bold text-gray-900 text-base">功能准备就绪</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                {selectedTool?.name || '该应用'}已为 {advisorName} 准备就绪，可在【{storeName}】直接继续处理业务。
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#1a6fd4] hover:bg-[#155caf] text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
