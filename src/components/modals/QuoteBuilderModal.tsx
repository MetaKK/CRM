import React, { useState } from 'react';
import {
  X,
  Calculator,
  Share2,
  CheckCircle2,
  AlertCircle,
  Car,
  DollarSign,
  Send,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';
import { ClientRecord } from '../../types';

interface QuoteBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientRecord | null;
  advisorName: string;
  storeName: string;
  onGenerateQuote?: () => void;
  onShareQuote?: () => void;
  onCancelQuote?: () => void;
  onQuoteFailed?: () => void;
}

export const QuoteBuilderModal: React.FC<QuoteBuilderModalProps> = ({
  isOpen,
  onClose,
  client,
  advisorName,
  storeName,
  onGenerateQuote,
  onShareQuote,
  onCancelQuote,
  onQuoteFailed,
}) => {
  if (!isOpen || !client) return null;

  // Quote State
  const [carModel, setCarModel] = useState(client.intentCar || 'TIGGO 8 Pro Max (瑞虎8)');
  const [basePrice, setBasePrice] = useState(139900);
  const [optionsPrice, setOptionsPrice] = useState(5000);
  const [discountPercent, setDiscountPercent] = useState(3); // 3%
  const [tradeInAllowance, setTradeInAllowance] = useState(client.tradeInCar ? 15000 : 0);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20); // 20%
  const [loanTermMonths, setLoanTermMonths] = useState(36); // 36 months

  // Calculated Numbers
  const discountAmount = Math.round((basePrice + optionsPrice) * (discountPercent / 100));
  const subtotalPrice = basePrice + optionsPrice - discountAmount - tradeInAllowance;
  const downPaymentAmount = Math.round(subtotalPrice * (downPaymentPercent / 100));
  const loanAmount = subtotalPrice - downPaymentAmount;
  const monthlyInstallment = Math.round(loanAmount / loanTermMonths);

  const needsApproval = discountPercent > 2;

  const [copied, setCopied] = useState(false);

  const handleCopyQuote = async () => {
    onGenerateQuote?.();
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      await navigator.clipboard?.writeText(`CRM 报价卡已生成 · ${carModel}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onQuoteFailed?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 sm:p-4">
      <div className="bg-white w-full max-w-md max-h-[92vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 border border-slate-200/60">
        {/* Apple Sheet Pull Bar Indicator */}
        <div className="w-full pt-2.5 pb-1 flex justify-center bg-[#dfeaf6] sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#a9bdd4]" />
        </div>

        {/* Header */}
        <div className="p-4 bg-[linear-gradient(145deg,#1a6fd4,#155caf)] text-white flex justify-between items-center relative border-b border-blue-700">
          <div>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full font-bold">
              安奇汽车国际营销 · 全包报价单
            </span>
            <h3 className="font-extrabold text-base tracking-tight mt-1">给 {client.name} 开立官方报价单</h3>
          </div>
          <button
            onClick={() => {
              onCancelQuote?.();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-white/15 text-blue-100 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs text-slate-700 bg-[#f7fbff]">
          {/* Selected Vehicle */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 stripe-card-shadow space-y-2">
            <label className="font-extrabold text-slate-900 block text-xs tracking-tight">选择车型与配置</label>
            <select
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="TIGGO 8 Pro Max (瑞虎8)">TIGGO 8 Pro Max 2.0T AWD Premium (AED 139,900)</option>
              <option value="Exeed Sterra ES (星纪元 ES)">Exeed Sterra ES 905km Ultra 旗舰智驾版 (AED 219,800)</option>
              <option value="iCAR 03 智驾长续航">iCAR 03 4WD 越野版 (AED 145,800)</option>
            </select>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 bg-white p-3 rounded-2xl border border-slate-200/80 stripe-card-shadow">
              <label className="font-semibold text-slate-500 block text-[11px]">裸车价格 (MSRP)</label>
              <input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2 font-mono text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-1 bg-white p-3 rounded-2xl border border-slate-200/80 stripe-card-shadow">
              <label className="font-semibold text-slate-500 block text-[11px]">选装件/智驾包</label>
              <input
                type="number"
                value={optionsPrice}
                onChange={(e) => setOptionsPrice(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2 font-mono text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Discount & Trade-In */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 bg-white p-3 rounded-2xl border border-slate-200/80 stripe-card-shadow">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-slate-500 block text-[11px]">商务折扣 (%)</label>
                {needsApproval && (
                  <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">需审批</span>
                )}
              </div>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2 font-mono text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-1 bg-white p-3 rounded-2xl border border-slate-200/80 stripe-card-shadow">
              <label className="font-semibold text-slate-500 block text-[11px]">旧车置换补贴</label>
              <input
                type="number"
                value={tradeInAllowance}
                onChange={(e) => setTradeInAllowance(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-2 font-mono text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Finance Options */}
          <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-100 stripe-card-shadow space-y-2">
            <span className="font-extrabold text-blue-950 text-xs block tracking-tight">金融分期按揭方案</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 font-medium block">首付比例 (%)</label>
                <select
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="w-full bg-white border border-blue-200/80 rounded-xl p-2 text-xs font-extrabold text-slate-900 outline-none"
                >
                  <option value={10}>10% (低首付)</option>
                  <option value={20}>20% (推荐方案)</option>
                  <option value={30}>30%</option>
                  <option value={50}>50%</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-medium block">贷款期限 (月)</label>
                <select
                  value={loanTermMonths}
                  onChange={(e) => setLoanTermMonths(Number(e.target.value))}
                  className="w-full bg-white border border-blue-200/80 rounded-xl p-2 text-xs font-extrabold text-slate-900 outline-none"
                >
                  <option value={24}>24 期 (2年)</option>
                  <option value={36}>36 期 (3年)</option>
                  <option value={48}>48 期 (4年)</option>
                  <option value={60}>60 期 (5年)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Calculation Summary Card */}
          <div className="bg-[linear-gradient(145deg,#1a6fd4,#155caf)] text-white p-4 rounded-2xl space-y-2 font-mono text-xs shadow-lg border border-blue-700">
            <div className="flex justify-between border-b border-white/20 pb-2">
              <span className="text-blue-100 font-sans">车价全包总额 (Subtotal):</span>
              <span className="font-extrabold text-white text-sm">AED {subtotalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-blue-50">
              <span className="font-sans">首付总计 ({downPaymentPercent}%):</span>
              <span className="font-bold">AED {downPaymentAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-blue-50">
              <span className="font-sans">预估月供 ({loanTermMonths}期):</span>
              <span className="font-bold text-white">AED {monthlyInstallment.toLocaleString()} / 月</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200/80 flex gap-2">
          <button
            onClick={handleCopyQuote}
            className="flex-1 py-3 border border-[#c6def8] bg-white hover:bg-blue-50 text-[#1a6fd4] font-extrabold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2]" /> : <Share2 className="w-4 h-4 stroke-[2]" />}
            {copied ? '已复制报价卡片' : '生成并复制报价卡'}
          </button>
          <a
            href={`https://wa.me/${client.countryCode}${client.phone}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => onShareQuote?.()}
            className="flex-1 py-3 bg-[#1a6fd4] hover:bg-[#155caf] text-white font-extrabold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm"
          >
            <Send className="w-4 h-4 stroke-[2]" />
            WhatsApp 发送客户
          </a>
        </div>
      </div>
    </div>
  );
};
