import React from 'react';
import {
  Sparkles,
  LayoutGrid,
  Users,
  Disc,
  FileText,
  CheckSquare,
  Car,
  Wrench,
  Package,
  BarChart3,
  RefreshCw,
  DollarSign,
  ShieldCheck,
  LucideIcon,
} from 'lucide-react';
import { TabType, RoleAccount } from '../types';

interface TabBarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  currentAccount: RoleAccount;
}

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  LayoutGrid,
  Users,
  Disc,
  FileText,
  CheckSquare,
  Car,
  Wrench,
  Package,
  BarChart3,
  RefreshCw,
  DollarSign,
  ShieldCheck,
};

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onSelectTab, currentAccount }) => {
  const tabs = currentAccount.tabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-[430px] mx-auto bg-white border-t border-[#eef1f7] px-2 pt-2.5 pb-5 select-none shadow-none">
      <div className="flex justify-around items-center">
        {tabs.map((tab) => {
          const Icon = iconMap[tab.iconName] || LayoutGrid;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative group cursor-pointer transition-all duration-150 ${
                isActive ? 'text-[#1a6fd4]' : 'text-[#b0bcd8] hover:text-slate-600'
              }`}
            >
              {/* Icon Container with Badge */}
              <div className="relative flex items-center justify-center mb-0.5">
                <Icon
                  className={`w-[22px] h-[22px] transition-transform duration-200 group-active:scale-85 ${
                    isActive ? 'stroke-[2.1] text-[#1a6fd4]' : 'stroke-[1.7] text-[#b0bcd8]'
                  }`}
                />

                {tab.hasSparkle && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1a6fd4] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1a6fd4]" />
                  </span>
                )}

                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-[#ff3b30] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[15px] text-center shadow-xs">
                    {tab.badge}
                  </span>
                ) : null}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] tracking-tight ${
                  isActive ? 'text-[#1a6fd4] font-semibold' : 'text-[#b0bcd8] font-normal'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
