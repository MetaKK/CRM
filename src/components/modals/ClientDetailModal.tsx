import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  MessageSquare,
  Shield,
  Car,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  FileText,
  DollarSign,
  AlertTriangle,
  Send,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { ClientRecord } from '../../types';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientRecord | null;
  onOpenQuoteBuilder: (client: ClientRecord) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  isOpen,
  onClose,
  client,
  onOpenQuoteBuilder,
}) => {
  if (!isOpen || !client) return null;

  const [activeTab, setActiveTab] = useState<'360' | 'timeline' | 'vehicle' | 'consent'>('360');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 sm:p-4">
      <div className="bg-white w-full max-w-md max-h-[90vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200 border border-slate-200/60">
        {/* Apple Sheet Pull Bar Indicator */}
        <div className="w-full pt-2.5 pb-1 flex justify-center bg-[#dfeaf6] sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#a9bdd4]" />
        </div>

        {/* Header */}
        <div className="p-4 bg-[linear-gradient(145deg,#1a6fd4,#155caf)] text-white flex justify-between items-center relative border-b border-blue-700">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl ${client.avatarBg} text-white font-extrabold flex items-center justify-center text-lg shadow-md shrink-0`}>
              {client.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white tracking-tight">{client.name}</h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-400/30 font-medium">
                  {client.customerGlobalId}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="font-mono">{client.countryCode} {client.phone}</span>
                <span>·</span>
                <span className="text-amber-300 font-semibold">{client.householdRole}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/15 text-blue-100 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* SLA Bar */}
        <div className={`px-4 py-2 flex items-center justify-between text-xs font-semibold ${
          client.slaStatus === 'warning'
            ? 'bg-amber-50 text-amber-900 border-b border-amber-200/80'
            : client.slaStatus === 'overdue'
            ? 'bg-rose-50 text-rose-900 border-b border-rose-200/80'
            : 'bg-emerald-50 text-emerald-900 border-b border-emerald-200/80'
        }`}>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 stroke-[2]" />
            <span>SLA跟进状态：{client.slaStatus === 'warning' ? '⚠️ 即将超时，请联系' : client.slaStatus === 'overdue' ? '❌ 已超时预警' : '✅ 正常跟进中'}</span>
          </div>
          <span className="font-mono text-[10px] font-bold bg-white/90 px-2.5 py-0.5 rounded-full border border-slate-200/60 shadow-2xs">
            剩余 {client.slaCountdownMinutes} 分钟
          </span>
        </div>

        {/* Apple Segmented Tab Switcher */}
        <div className="p-1 bg-slate-100 border-b border-slate-200/60 flex text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('360')}
            className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${activeTab === '360' ? 'text-slate-900 bg-white shadow-xs font-extrabold' : 'hover:text-slate-900'}`}
          >
            客户 360
          </button>
          <button
            onClick={() => setActiveTab('vehicle')}
            className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${activeTab === 'vehicle' ? 'text-slate-900 bg-white shadow-xs font-extrabold' : 'hover:text-slate-900'}`}
          >
            车辆 VIN
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${activeTab === 'timeline' ? 'text-slate-900 bg-white shadow-xs font-extrabold' : 'hover:text-slate-900'}`}
          >
            触点归因
          </button>
          <button
            onClick={() => setActiveTab('consent')}
            className={`flex-1 py-2 text-center rounded-xl transition-all cursor-pointer ${activeTab === 'consent' ? 'text-slate-900 bg-white shadow-xs font-extrabold' : 'hover:text-slate-900'}`}
          >
            GDPR 授权
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-xs text-slate-700 bg-[#f7fbff]">
          {activeTab === '360' && (
            <div className="space-y-3">
              {/* Opportunity Funnel Card */}
              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-100 stripe-card-shadow space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-blue-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600 stroke-[2]" />
                    当前销售机会阶段
                  </span>
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-600 text-white shadow-2xs">
                    {client.opportunityStage}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100/80 shadow-2xs">
                    <span className="text-slate-400 block text-[10px]">意向车型</span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">{client.intentCar}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-blue-100/80 shadow-2xs">
                    <span className="text-slate-400 block text-[10px]">购车预算</span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">{client.budget}</span>
                  </div>
                </div>
              </div>

              {/* Trade-in Section */}
              {client.tradeInCar && (
                <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/60 stripe-card-shadow space-y-1">
                  <div className="font-extrabold text-amber-950 flex items-center justify-between">
                    <span>置换旧车评估 (Trade-In)</span>
                    <span className="text-amber-800 font-mono text-[11px] font-bold">{client.tradeInCar.estimatedValue}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] font-medium">
                    {client.tradeInCar.brandModel} · {client.tradeInCar.year}年款
                  </p>
                </div>
              )}

              {/* AI Copilot Next Action */}
              <div className="p-4 bg-[linear-gradient(145deg,#1a6fd4,#155caf)] text-white rounded-2xl space-y-2.5 shadow-lg border border-blue-700">
                <div className="flex items-center gap-1.5 text-blue-100 font-extrabold text-[11px] tracking-tight">
                  <Sparkles className="w-4 h-4 text-white stroke-[2]" />
                  小万 AI 推荐顾问下一步动作
                </div>
                <p className="text-blue-50 text-[11px] leading-relaxed">
                  客户已查看 <span className="text-white underline underline-offset-2 font-bold">{client.intentCar}</span> 报价，且在寻找适合的低首付金融方案。建议通过 WhatsApp 发送当前店内的 36 个月免息方案及 VIN 现车预留凭证。
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenQuoteBuilder(client);
                    }}
                    className="flex-1 py-2 bg-white hover:bg-blue-50 text-[#1a6fd4] font-extrabold rounded-xl text-[11px] text-center cursor-pointer active:scale-95 transition-all shadow-sm"
                  >
                    生成多版本报价方案
                  </button>
                  <a
                    href={`https://wa.me/${client.countryCode}${client.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 border border-white/55 bg-white/15 hover:bg-white/25 text-white font-extrabold rounded-xl text-[11px] flex items-center gap-1 cursor-pointer active:scale-95 transition-all shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5 stroke-[2]" />
                    WhatsApp 联系
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vehicle' && (
            <div className="space-y-3">
              {client.matchedVehicle ? (
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 stripe-card-shadow space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-900 text-sm tracking-tight">{client.matchedVehicle.modelName}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                      {client.matchedVehicle.locationStatus}
                    </span>
                  </div>
                  <div className="text-[11px] space-y-1.5 text-slate-600 bg-slate-50/80 p-3 rounded-xl font-mono border border-slate-100">
                    <div><span className="text-slate-400">VIN 识别码:</span> <strong className="text-slate-900">{client.matchedVehicle.vin}</strong></div>
                    <div><span className="text-slate-400">配置:</span> {client.matchedVehicle.configTrim}</div>
                    <div><span className="text-slate-400">外观/内饰:</span> {client.matchedVehicle.colorExterior} / {client.matchedVehicle.colorInterior}</div>
                    <div><span className="text-slate-400">预计交车到店:</span> {client.matchedVehicle.estimatedArrival}</div>
                    <div><span className="text-slate-400">指导全包价:</span> <strong className="text-blue-600">{client.matchedVehicle.msrp.toLocaleString()} {client.matchedVehicle.currency}</strong></div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <Car className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="font-medium">暂未绑定具体 VIN 车辆库存</p>
                  <button className="px-4 py-2 bg-[#1a6fd4] text-white font-bold text-xs rounded-lg cursor-pointer hover:bg-[#155caf] active:scale-95 transition-all shadow-xs">
                    前往 VIN 库配对现车
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 stripe-card-shadow space-y-2">
                <span className="font-extrabold text-slate-900 text-xs block tracking-tight">线索最初来源与归因数据</span>
                <div className="text-[11px] space-y-1.5 text-slate-600 font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>渠道大类：<strong className="text-slate-900">{client.channelOrigin.category}</strong></div>
                  <div>投放平台：<strong className="text-slate-900">{client.channelOrigin.platform}</strong></div>
                  <div>广告活动：{client.channelOrigin.campaign}</div>
                  <div>表单版本：{client.channelOrigin.formVersion}</div>
                  <div>提交时间：{client.channelOrigin.createdTime}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'consent' && (
            <div className="space-y-2">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 stripe-card-shadow space-y-2.5">
                <span className="font-extrabold text-slate-900 text-xs block tracking-tight">GDPR & 跨境隐私授权 (Privacy Consent)</span>
                <div className="space-y-2 text-[11px] font-medium">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50">
                    <span>WhatsApp 营销沟通授权:</span>
                    <span className={client.consentMap.whatsapp ? 'text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded' : 'text-slate-400'}>{client.consentMap.whatsapp ? '✅ 已授权' : '❌ 未授权'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50">
                    <span>电话致电跟进授权:</span>
                    <span className={client.consentMap.phoneCall ? 'text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded' : 'text-slate-400'}>{client.consentMap.phoneCall ? '✅ 已授权' : '❌ 未授权'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50">
                    <span>跨境数据传输与车企总部存档:</span>
                    <span className={client.consentMap.dataCrossBorder ? 'text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded' : 'text-slate-400'}>{client.consentMap.dataCrossBorder ? '✅ 已同意' : '❌ 未同意'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-white border-t border-slate-200/80 flex gap-2">
          <a
            href={`tel:${client.phone}`}
            className="flex-1 py-3 border border-[#c6def8] bg-white hover:bg-blue-50 text-[#1a6fd4] font-extrabold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <Phone className="w-4 h-4 stroke-[2]" />
            电话跟进
          </a>
          <button
            onClick={() => {
              onClose();
              onOpenQuoteBuilder(client);
            }}
            className="flex-1 py-3 bg-[#1a6fd4] hover:bg-[#155caf] text-white font-extrabold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm"
          >
            <FileText className="w-4 h-4 stroke-[2]" />
            开立报价单
          </button>
        </div>
      </div>
    </div>
  );
};
