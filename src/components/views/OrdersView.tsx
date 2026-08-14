import React from 'react';
import { Check, Plus, RotateCcw } from 'lucide-react';
import { businessDemoRecords, mockOrders } from '../../data/mockData';
import { BusinessDemoRecord, BusinessNavigationIntent, BusinessRecordStatus, OperatingDemoSnapshot } from '../../types';
import { getOperatingRecordStatus } from '../../lib/operatingDemo';

interface OrdersViewProps {
  onOrderCreated?: () => void;
  onContractOpened?: () => void;
  onDeliveryStarted?: () => void;
  accountId?: string;
  operatingSnapshot?: OperatingDemoSnapshot;
  navigationIntent?: BusinessNavigationIntent | null;
  onBusinessStatusChange?: (record: BusinessDemoRecord, status: BusinessRecordStatus) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  onOrderCreated,
  onContractOpened,
  onDeliveryStarted,
  accountId,
  operatingSnapshot,
  navigationIntent,
  onBusinessStatusChange,
}) => {
  const focusedIds = navigationIntent?.tab === 'orders' && navigationIntent.recordIds?.length
    ? new Set(navigationIntent.recordIds)
    : null;
  const operatingRecords = businessDemoRecords.filter((record) => (
    record.roleId === accountId
    && record.module === 'orders'
    && (!focusedIds || focusedIds.has(record.id))
  ));

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

      {operatingRecords.length > 0 && operatingSnapshot && onBusinessStatusChange && (
        <div className="space-y-2.5">
          {focusedIds && (
            <div className="rounded-xl border border-[#cfe2f5] bg-[#f3f8fe] px-3.5 py-2.5 text-[11px] text-[#5a6a88]">
              <strong className="text-[#1a6fd4]">来自经营概览</strong> · 已定位当前交付风险
            </div>
          )}
          {operatingRecords.map((record) => {
            const status = getOperatingRecordStatus(operatingSnapshot, record);
            return (
              <article key={record.id} className="crm-card border-[#cfe2f5] bg-[#f8fbff] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-[#1a6fd4]">{record.title}</span>
                    <h3 className="mt-1 truncate text-[14px] font-bold text-[#1a2438]">{record.subject}</h3>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold ${status === 'completed' ? 'bg-emerald-50 text-emerald-700' : status === 'in_progress' ? 'bg-blue-50 text-[#1a6fd4]' : 'bg-amber-50 text-amber-700'}`}>
                    {status === 'completed' ? '资料已确认' : status === 'in_progress' ? '核验中' : '待核验'}
                  </span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-[#5a6a88]">{record.description}</p>
                <p className="mt-2 text-[10px] text-[#8a9ab8]">{record.meta}</p>
                <div className="mt-3 flex justify-end">
                  {status === 'pending' && <button type="button" onClick={() => onBusinessStatusChange(record, 'in_progress')} className="min-h-9 rounded-lg bg-[#1a6fd4] px-3 text-[11px] font-semibold text-white cursor-pointer">{record.primaryActionLabel}</button>}
                  {status === 'in_progress' && <button type="button" onClick={() => onBusinessStatusChange(record, 'completed')} className="flex min-h-9 items-center gap-1 rounded-lg bg-[#1a6fd4] px-3 text-[11px] font-semibold text-white cursor-pointer"><Check className="h-3.5 w-3.5" />{record.confirmActionLabel}</button>}
                  {status === 'completed' && <button type="button" onClick={() => onBusinessStatusChange(record, 'in_progress')} className="flex min-h-9 items-center gap-1 rounded-lg border border-[#dce6f1] bg-white px-3 text-[11px] font-semibold text-[#1a6fd4] cursor-pointer"><RotateCcw className="h-3.5 w-3.5" />恢复核验</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}

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
