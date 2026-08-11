import React from 'react';
import { Users, Calendar, Clock, FileText } from 'lucide-react';
import { MetricData } from '../types';

interface MetricsCardProps {
  metrics: MetricData[];
  onSelectMetric: (metricId: MetricData['id']) => void;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ metrics, onSelectMetric }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users':
        return <Users className="w-[18px] h-[18px] text-[#2563eb]" />;
      case 'Calendar':
        return <Calendar className="w-[18px] h-[18px] text-[#10b981]" />;
      case 'Clock':
        return <Clock className="w-[18px] h-[18px] text-[#f59e0b]" />;
      case 'FileText':
        return <FileText className="w-[18px] h-[18px] text-[#3b82f6]" />;
      default:
        return <Users className="w-[18px] h-[18px] text-[#2563eb]" />;
    }
  };

  return (
    <div className="mx-4 my-2.5 bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100/80 select-none">
      <div className="grid grid-cols-4 divide-x divide-slate-100">
        {metrics.map((metric) => (
          <button
            key={metric.id}
            onClick={() => onSelectMetric(metric.id)}
            className="flex flex-col items-center justify-between px-1 py-0.5 group active:scale-95 transition-all duration-150 cursor-pointer"
          >
            {/* Top Icon Circle */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1.5 bg-slate-50 group-hover:bg-blue-50 transition-colors">
              {getIcon(metric.iconName)}
            </div>

            {/* Middle Label */}
            <span className="text-[12px] font-normal text-slate-500 tracking-tight mb-1 group-hover:text-blue-600 transition-colors">
              {metric.label}
            </span>

            {/* Bottom Big Number */}
            <span className="text-[21px] font-extrabold text-slate-900 tracking-tight leading-none group-hover:scale-105 transition-transform">
              {metric.value}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

