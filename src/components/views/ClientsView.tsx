import React, { useState } from 'react';
import { Search, Plus, FileText, Send, AlertTriangle } from 'lucide-react';
import { mockClients } from '../../data/mockData';
import { ClientRecord } from '../../types';

interface ClientsViewProps {
  onSelectClient: (client: ClientRecord) => void;
  onOpenQuoteBuilder: (client: ClientRecord) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onSelectClient,
  onOpenQuoteBuilder,
}) => {
  const [activeTab, setActiveTab] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = ['全部', '需求确认', '待试驾', '方案报价', '已订车'];

  const filtered = mockClients.filter((c) => {
    const matchesTab = activeTab === '全部' || c.status === activeTab;
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.intentCar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="crm-page space-y-3.5 select-none">
      {/* Top Title Bar */}
      <div className="flex items-center justify-between px-0.5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">客户与线索</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">全渠道线索 · 客户 360 视图</p>
        </div>
        <button
          onClick={() => alert('新增客户录入：已自动匹配手机号查重')}
          className="px-3.5 py-2 bg-[#1a6fd4] hover:bg-[#155caf] text-white font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer active:scale-95 transition-all shrink-0 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          新增客户
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 stroke-[2]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="搜索姓名、车型或手机号..."
          className="w-full text-xs pl-9 pr-3 py-2.5 bg-white rounded-xl outline-none border border-[#dce6f1] focus:border-[#1a6fd4]/40 focus:ring-2 focus:ring-[#1a6fd4]/10 transition-all text-slate-900 placeholder-slate-400 font-medium"
        />
      </div>

      <div className="flex items-center gap-5 overflow-x-auto no-scrollbar border-b border-[#dce6f1] px-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative pb-2.5 text-xs font-medium shrink-0 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab
                ? 'text-[#1a6fd4] font-bold'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab}
            {activeTab === tab && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#1a6fd4]" />}
          </button>
        ))}
      </div>

      {/* Client List - iOS Inset Grouped Cards */}
      <div className="space-y-2.5 pt-0.5">
        {filtered.map((client) => (
          <div
            key={client.id}
            onClick={() => onSelectClient(client)}
            className="crm-card p-3.5 space-y-2.5 cursor-pointer active:bg-slate-50 transition-all"
          >
            <div className="flex items-start justify-between min-w-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                <div
                  className={`w-10 h-10 rounded-[14px] ${client.avatarBg} text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs`}
                >
                  {client.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                    <span className="font-extrabold text-slate-900 text-sm tracking-tight truncate max-w-[110px] sm:max-w-[150px]">
                      {client.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-[#1a6fd4] shrink-0 whitespace-nowrap">
                      {client.opportunityStage}
                    </span>
                    {client.slaStatus === 'warning' && (
                      <span className="text-[9px] bg-[#ff3b30]/10 text-[#ff3b30] font-semibold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 border border-[#ff3b30]/20 shrink-0 whitespace-nowrap">
                        <AlertTriangle className="w-2.5 h-2.5 text-[#ff3b30] stroke-[2]" />
                        SLA 预警
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">{client.intentCar}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onOpenQuoteBuilder(client)}
                  className="p-2 rounded-lg bg-blue-50 text-[#1a6fd4] hover:bg-[#1a6fd4] hover:text-white active:scale-90 transition-all cursor-pointer"
                  title="开立报价单"
                >
                  <FileText className="w-3.5 h-3.5 stroke-[2]" />
                </button>
                <a
                  href={`https://wa.me/${client.countryCode}${client.phone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-[#34c759]/10 text-[#34c759] hover:bg-[#34c759] hover:text-white active:scale-90 transition-all cursor-pointer"
                  title="WhatsApp 联系"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2]" />
                </a>
              </div>
            </div>

            {/* Bottom Details Bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-mono whitespace-nowrap overflow-hidden">
                <span className="bg-[#f8fbff] px-2 py-0.5 rounded-lg text-slate-600 font-sans font-medium border border-[#eaf0f7] truncate max-w-[120px]">
                来源: {client.channelOrigin.platform}
              </span>
              <span className="font-semibold text-slate-800 shrink-0">预算: {client.budget}</span>
              <span className="text-slate-400 shrink-0">跟进: {client.lastContact}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
