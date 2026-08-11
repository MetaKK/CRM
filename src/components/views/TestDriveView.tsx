import React from 'react';
import { Car, Clock, Plus, Phone, MapPin } from 'lucide-react';
import { mockTestDrives } from '../../data/mockData';

export const TestDriveView: React.FC = () => {
  return (
    <div className="crm-page space-y-3.5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-0.5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">试驾中心</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">驾照核验 · 免责协议 · 线路规划</p>
        </div>
        <button
          onClick={() => alert('已打开发起预约试驾登记卡片')}
          className="px-3.5 py-2 bg-[#1a6fd4] hover:bg-[#155caf] text-white font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer active:scale-95 transition-all shrink-0 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          预约试驾
        </button>
      </div>

      {/* Test Drive Cards - iOS Inset Grouped */}
      <div className="space-y-2.5 pt-0.5">
        {mockTestDrives.map((td) => (
          <div
            key={td.id}
            className="crm-card p-3.5 space-y-2.5"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1a6fd4] flex items-center justify-center shrink-0">
                  <Car className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="font-extrabold text-slate-900 text-sm tracking-tight truncate">{td.carModel}</span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-[#1a6fd4] shrink-0 whitespace-nowrap">
                {td.status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-sm truncate pr-2">{td.clientName}</span>
                <span className="text-slate-700 font-mono text-[11px] font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 shrink-0 whitespace-nowrap">
                  <Clock className="w-3 h-3 text-[#ff9500] stroke-[2.2]" />
                  {td.timeSlot}
                </span>
              </div>

              <div className="p-2.5 bg-[#f8f8fa] rounded-[14px] space-y-1 text-[11px] font-mono text-slate-700 border border-slate-200/40">
                <div className="flex justify-between items-center">
                  <span className="truncate pr-2">VIN: <strong className="text-slate-900 font-bold">{td.vinAssigned}</strong></span>
                  <span className="text-[#34c759] font-bold bg-[#34c759]/15 px-2 py-0.2 rounded-full text-[10px] shrink-0 whitespace-nowrap">钥匙已领</span>
                </div>
                <div className="flex items-center gap-1 text-slate-600 font-sans truncate">
                  <MapPin className="w-3 h-3 text-[#1a6fd4] stroke-[2.2] shrink-0" />
                  线路: <span className="font-semibold text-slate-800 truncate">{td.route}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400 font-mono">
              <span className="truncate pr-2">顾问: {td.advisor}</span>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`tel:${td.phone}`}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer active:scale-90 transition-all"
                  title="拨打电话"
                >
                  <Phone className="w-3.5 h-3.5 stroke-[2]" />
                </a>
                <button
                  onClick={() => alert(`办理接车：电子签署驾照免责协议`)}
                  className="px-3.5 py-1.5 bg-[#1a6fd4] hover:bg-[#155caf] text-white font-semibold text-xs rounded-lg cursor-pointer active:scale-95 transition-all whitespace-nowrap"
                >
                  签署并发车
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
