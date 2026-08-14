import React from 'react';
import {
  AlertTriangle,
  BarChart3,
  Check,
  CheckSquare,
  ChevronRight,
  Package,
  RotateCcw,
  Wrench,
} from 'lucide-react';
import { BusinessDemoRecord, BusinessNavigationIntent, BusinessRecordStatus, OperatingDemoSnapshot, RoleAccount, TabType } from '../../types';
import { getBusinessRecordsForRole, getOperatingRecordStatus } from '../../lib/operatingDemo';

interface BusinessModuleViewProps {
  account: RoleAccount;
  tab: Extract<TabType, 'approvals' | 'inventory' | 'service' | 'region'>;
  snapshot: OperatingDemoSnapshot;
  intent?: BusinessNavigationIntent | null;
  onStatusChange: (record: BusinessDemoRecord, status: BusinessRecordStatus) => void;
}

const moduleMeta: Record<BusinessModuleViewProps['tab'], { title: string; subtitle: string; icon: React.ReactNode }> = {
  approvals: { title: '报价审批', subtitle: '权限判断 · 临期优先 · 决策留痕', icon: <CheckSquare className="h-5 w-5" /> },
  inventory: { title: '库存与资源', subtitle: '车辆 / 配件 / 配额的角色化处理', icon: <Package className="h-5 w-5" /> },
  service: { title: '维保工单', subtitle: '预约接车 · 维修进度 · 完工确认', icon: <Wrench className="h-5 w-5" /> },
  region: { title: '大区经营', subtitle: '门店排名 · 异常识别 · 经营复盘', icon: <BarChart3 className="h-5 w-5" /> },
};

const statusMeta: Record<BusinessRecordStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-amber-50 text-amber-700' },
  in_progress: { label: '处理中', className: 'bg-blue-50 text-[#1a6fd4]' },
  completed: { label: '已确认', className: 'bg-emerald-50 text-emerald-700' },
  rejected: { label: '已退回', className: 'bg-slate-100 text-[#5a6a88]' },
};

export const BusinessModuleView: React.FC<BusinessModuleViewProps> = ({
  account,
  tab,
  snapshot,
  intent,
  onStatusChange,
}) => {
  const meta = moduleMeta[tab];
  const allRecords = getBusinessRecordsForRole(account.id).filter((record) => record.module === tab);
  const focusedIds = intent?.tab === tab && intent.recordIds?.length ? new Set(intent.recordIds) : null;
  const records = focusedIds ? allRecords.filter((record) => focusedIds.has(record.id)) : allRecords;

  return (
    <div className="crm-page space-y-3.5 select-none">
      <div className="flex items-start justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold tracking-tight text-[#1a2438]">{meta.title}</h2>
          <p className="mt-0.5 text-[11px] text-[#5a6a88]">{meta.subtitle}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1a6fd4]">{meta.icon}</span>
      </div>

      {focusedIds && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#cfe2f5] bg-[#f3f8fe] px-3.5 py-2.5">
          <div className="min-w-0">
            <span className="block text-[10px] font-semibold text-[#1a6fd4]">来自经营概览</span>
            <span className="mt-0.5 block truncate text-[11px] text-[#5a6a88]">已筛选当前信号相关的 {records.length} 条高优先级记录</span>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#1a6fd4]" />
        </div>
      )}

      {records.length > 0 ? (
        <div className="space-y-2.5">
          {records.map((record) => {
            const status = getOperatingRecordStatus(snapshot, record);
            const statusView = statusMeta[status];
            return (
              <article key={record.id} className={`crm-card p-4 ${focusedIds?.has(record.id) ? 'ring-1 ring-[#b9d7f3]' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#1a6fd4]">
                      {record.filters.some((filter) => filter.includes('risk') || filter.includes('abnormal') || filter.includes('pending')) && <AlertTriangle className="h-3.5 w-3.5" />}
                      {record.title}
                    </span>
                    <h3 className="mt-1 truncate text-[14px] font-bold text-[#1a2438]">{record.subject}</h3>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold ${statusView.className}`}>{statusView.label}</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-[#5a6a88]">{record.description}</p>
                <p className="mt-2 border-t border-[#eaf0f7] pt-2 text-[10px] text-[#8a9ab8]">{record.meta}</p>

                <div className="mt-3 flex items-center justify-end gap-2">
                  {status === 'pending' && record.actionType === 'approve' && (
                    <button type="button" onClick={() => onStatusChange(record, 'rejected')} className="min-h-9 rounded-lg border border-[#dce6f1] bg-white px-3 text-[11px] font-semibold text-[#5a6a88] cursor-pointer">
                      退回补充
                    </button>
                  )}
                  {status === 'pending' && (
                    <button type="button" onClick={() => onStatusChange(record, 'in_progress')} className="min-h-9 rounded-lg bg-[#1a6fd4] px-3 text-[11px] font-semibold text-white cursor-pointer hover:bg-[#155caf]">
                      {record.primaryActionLabel}
                    </button>
                  )}
                  {status === 'in_progress' && (
                    <button type="button" onClick={() => onStatusChange(record, 'completed')} className="flex min-h-9 items-center gap-1 rounded-lg bg-[#1a6fd4] px-3 text-[11px] font-semibold text-white cursor-pointer hover:bg-[#155caf]">
                      <Check className="h-3.5 w-3.5" />{record.confirmActionLabel}
                    </button>
                  )}
                  {(status === 'completed' || status === 'rejected') && (
                    <button type="button" onClick={() => onStatusChange(record, 'in_progress')} className="flex min-h-9 items-center gap-1 rounded-lg border border-[#dce6f1] bg-white px-3 text-[11px] font-semibold text-[#1a6fd4] cursor-pointer">
                      <RotateCcw className="h-3.5 w-3.5" />恢复处理
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="crm-card flex min-h-48 flex-col items-center justify-center px-6 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Check className="h-5 w-5" /></span>
          <h3 className="mt-3 text-[14px] font-bold text-[#1a2438]">当前筛选暂无待处理记录</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-[#8a9ab8]">已完成的演示动作仍保留在角色经营数据中，可通过重置经营演示恢复。</p>
        </div>
      )}
    </div>
  );
};

