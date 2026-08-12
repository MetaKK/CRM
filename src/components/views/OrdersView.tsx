import React from 'react';
import { Plus } from 'lucide-react';
import { mockOrders } from '../../data/mockData';

interface OrdersViewProps {
  onOrderCreated?: () => void;
  onContractOpened?: () => void;
  onDeliveryStarted?: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onOrderCreated, onContractOpened, onDeliveryStarted }) => {
  return (
    <div className="crm-page space-y-3.5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-0.5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">订单与交付</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">合同绑定 · PDI 质检 · 电子交付</p>
        </div>
        <button
          onClick={() => {
            onOrderCreated?.();
            alert('已打开开具新订车合同模块');
          }}
          className="px-3.5 py-2 bg-[#1a6fd4] hover:bg-[#155caf] text-white font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer active:scale-95 transition-all shrink-0 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          新建订单
        </button>
      </div>

      {/* Orders List - iOS Inset Grouped */}
      <div className="space-y-2.5 pt-0.5">
        {mockOrders.map((ord) => (
          <div
            key={ord.id}
            className="crm-card p-3.5 space-y-2.5"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-mono font-bold text-slate-500 truncate pr-2">
                合同: {ord.orderNo}
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-[#1a6fd4] shrink-0 whitespace-nowrap">
                {ord.status}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1 pr-2">
                <h4 className="font-extrabold text-slate-900 text-sm tracking-tight truncate">{ord.clientName}</h4>
                <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">{ord.carModel}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono truncate">
                  {ord.color} · 签约: {ord.date}
                </p>
              </div>

              <div className="text-right font-mono shrink-0">
                <span className="text-sm font-extrabold text-[#1a6fd4] block">{ord.totalPrice}</span>
                <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full mt-0.5 inline-block font-sans font-medium whitespace-nowrap">
                  已缴定金: {ord.deposit}
                </span>
              </div>
            </div>

            {/* Bound VIN & PDI Status */}
            <div className="p-2.5 bg-[#f8f8fa] rounded-[14px] text-[11px] font-mono text-slate-700 border border-slate-200/40 flex justify-between items-center">
              <span className="truncate pr-2">VIN: <strong className="text-slate-900 font-bold">{ord.boundVin}</strong></span>
              <span className="text-[#1a6fd4] font-bold bg-blue-50 px-2 py-0.5 rounded-full text-[10px] shrink-0 whitespace-nowrap">PDI: {ord.pdiStatus}</span>
            </div>

            <div className="flex justify-end gap-2 pt-0.5">
              <button
                onClick={() => {
                  onContractOpened?.();
                  alert('已打开订单合同');
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl cursor-pointer active:scale-95 transition-all whitespace-nowrap"
              >
                查看合同
              </button>
              <button
                onClick={() => {
                  onDeliveryStarted?.();
                  alert('进入交车仪式流程');
                }}
                className="px-3.5 py-1.5 bg-[#1a6fd4] hover:bg-[#155caf] text-white font-semibold text-xs rounded-lg cursor-pointer active:scale-95 transition-all whitespace-nowrap"
              >
                办理交车
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
