import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Target, X } from 'lucide-react';
import { businessDemoRecords, mockClients, mockOrders, mockTestDrives } from '../../data/mockData';
import {
  OperatingDemoSnapshot,
  OperatingPeriod,
  RoleAccount,
  WorkbenchOperatingMetric,
} from '../../types';
import {
  formatOperatingValue,
  getOperatingMetricValue,
  operatingPeriodLabels,
} from '../../lib/operatingDemo';

interface OperatingOverviewModalProps {
  isOpen: boolean;
  account: RoleAccount;
  period: OperatingPeriod;
  snapshot: OperatingDemoSnapshot;
  onClose: () => void;
  onPeriodChange: (period: OperatingPeriod) => void;
  onMetricOpen: (metric: WorkbenchOperatingMetric) => void;
}

const periods: OperatingPeriod[] = ['today', 'seven_days', 'month'];

const sampleLabel = (id: string) => {
  const business = businessDemoRecords.find((record) => record.id === id);
  if (business) return { title: business.subject, meta: business.title };
  const client = mockClients.find((record) => record.id === id);
  if (client) return { title: `${client.name} · ${client.intentCar}`, meta: client.opportunityStage };
  const testDrive = mockTestDrives.find((record) => record.id === id);
  if (testDrive) return { title: `${testDrive.clientName} · ${testDrive.carModel}`, meta: testDrive.status };
  const order = mockOrders.find((record) => record.id === id);
  if (order) return { title: `${order.clientName} · ${order.carModel}`, meta: order.status };
  return null;
};

export const OperatingOverviewModal: React.FC<OperatingOverviewModalProps> = ({
  isOpen,
  account,
  period,
  snapshot,
  onClose,
  onPeriodChange,
  onMetricOpen,
}) => {
  const [selectedMetricId, setSelectedMetricId] = useState(account.workbenchMetrics[0]?.id || '');

  useEffect(() => {
    setSelectedMetricId(account.workbenchMetrics[0]?.id || '');
  }, [account.id]);

  const selectedMetric = account.workbenchMetrics.find((metric) => metric.id === selectedMetricId)
    || account.workbenchMetrics[0];
  const selectedValue = selectedMetric ? getOperatingMetricValue(selectedMetric, period, snapshot) : 0;
  const target = selectedMetric?.targetValues?.[period];
  const progress = target ? Math.min(100, Math.round((selectedValue / target) * 100)) : null;
  const samples = useMemo(() => (
    (selectedMetric?.sampleRecordIds || []).map(sampleLabel).filter((sample): sample is NonNullable<typeof sample> => Boolean(sample))
  ), [selectedMetric]);

  if (!isOpen || !selectedMetric) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-[2px] animate-in fade-in duration-150 select-none">
      <section className="flex max-h-[94dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[24px] border border-[#eaf0f7] bg-white shadow-2xl animate-in slide-in-from-bottom duration-250">
        <header className="flex items-start justify-between gap-3 border-b border-[#eaf0f7] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[18px] font-bold text-[#1a2438]">全部经营数据</h2>
            <p className="mt-1 text-[11px] text-[#8a9ab8]">{account.roleTitle} · 统一时间口径与业务下钻</p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭经营数据" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f3f7fc] text-[#5a6a88] cursor-pointer">
            <X className="h-4.5 w-4.5" />
          </button>
        </header>

        <div className="overflow-y-auto px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-4">
          <div className="flex items-center gap-5 border-b border-[#eaf0f7] px-1" role="tablist" aria-label="经营数据时间范围">
            {periods.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={period === item}
                onClick={() => onPeriodChange(item)}
                className={`relative min-h-10 pb-2 text-[12px] font-semibold cursor-pointer ${period === item ? 'text-[#1a6fd4]' : 'text-[#8a9ab8]'}`}
              >
                {operatingPeriodLabels[item]}
                {period === item && <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#1a6fd4]" />}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#eaf0f7] bg-white">
            {account.workbenchMetrics.map((metric, index) => {
              const value = getOperatingMetricValue(metric, period, snapshot);
              const active = metric.id === selectedMetric.id;
              return (
                <button
                  key={metric.id}
                  type="button"
                  onClick={() => setSelectedMetricId(metric.id)}
                  className={`min-w-0 p-4 text-left cursor-pointer transition-colors ${active ? 'bg-[#f3f8fe]' : 'bg-white'} ${index % 2 === 0 ? 'border-r border-[#eaf0f7]' : ''} ${index < 2 ? 'border-b border-[#eaf0f7]' : ''}`}
                >
                  <span className={`block truncate text-[11px] ${active ? 'font-semibold text-[#1a6fd4]' : 'text-[#8a9ab8]'}`}>{metric.label}</span>
                  <span className="mt-1.5 flex items-baseline gap-1">
                    <strong className="text-[24px] leading-none text-[#1a2438]">{formatOperatingValue(value)}</strong>
                    {metric.unit && <span className="text-[10px] text-[#8a9ab8]">{metric.unit}</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-[#eaf0f7] bg-[#f8fbff] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-[#1a6fd4]">指标口径</span>
                <h3 className="mt-1 text-[14px] font-bold text-[#1a2438]">{selectedMetric.label}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5a6a88]">{selectedMetric.definition}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-[10px] font-semibold text-[#5a6a88]">{operatingPeriodLabels[period]}</span>
            </div>

            {target && progress !== null && (
              <div className="mt-4 border-t border-[#e2ecf7] pt-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 font-medium text-[#5a6a88]"><Target className="h-3.5 w-3.5 text-[#1a6fd4]" />目标进度</span>
                  <span className="font-semibold text-[#1a2438]">{formatOperatingValue(selectedValue)} / {formatOperatingValue(target)} {selectedMetric.unit}</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#dce8f5]">
                  <div className="h-full rounded-full bg-[#1a6fd4] transition-[width] duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>

          {samples.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3 px-1">
                <h3 className="text-[13px] font-bold text-[#1a2438]">高优先级明细</h3>
                <span className="text-[10px] text-[#8a9ab8]">展示 {samples.length} 条 / 共 {formatOperatingValue(selectedValue)} {selectedMetric.unit || '条'}</span>
              </div>
              <div className="mt-2 overflow-hidden rounded-2xl border border-[#eaf0f7] bg-white divide-y divide-[#eaf0f7]">
                {samples.map((sample) => (
                  <div key={`${selectedMetric.id}-${sample.title}`} className="px-4 py-3">
                    <strong className="block truncate text-[12px] text-[#1a2438]">{sample.title}</strong>
                    <span className="mt-1 block truncate text-[10px] text-[#8a9ab8]">{sample.meta}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => onMetricOpen(selectedMetric)}
            className="mt-4 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[#1a6fd4] px-4 text-[12px] font-semibold text-white cursor-pointer hover:bg-[#155caf]"
          >
            进入{selectedMetric.label}明细<ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
};

