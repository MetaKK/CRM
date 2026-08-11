import React from 'react';
import {
  Box,
  ShieldCheck,
  Bell,
  Store,
  Hexagon,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { MenuItem } from '../types';

interface MenuListProps {
  items: MenuItem[];
  currentStoreName: string;
  onMenuItemClick: (itemId: string) => void;
}

export const MenuList: React.FC<MenuListProps> = ({
  items,
  currentStoreName,
  onMenuItemClick,
}) => {
  const renderIcon = (itemId: string) => {
    switch (itemId) {
      case 'appCenter':
        return (
          <div className="w-9 h-9 rounded-xl bg-[#2563eb] text-white flex items-center justify-center shrink-0">
            <Box className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'accountSecurity':
        return (
          <div className="w-9 h-9 rounded-xl bg-[#e6f4ea] text-[#137333] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'notifications':
        return (
          <div className="w-9 h-9 rounded-xl bg-[#fef7e0] text-[#b06000] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'switchStore':
        return (
          <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'settings':
        return (
          <div className="w-9 h-9 rounded-xl bg-[#f3e8fd] text-[#9333ea] flex items-center justify-center shrink-0">
            <Hexagon className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case 'helpFeedback':
        return (
          <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 stroke-[2]" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
            <Box className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="mx-4 my-2.5 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100/80 overflow-hidden divide-y divide-slate-100 select-none">
      {items.map((item) => {
        // Dynamic subtitle for Switch Store
        const subtitleText =
          item.id === 'switchStore'
            ? `当前：${currentStoreName}`
            : item.subtitle;

        return (
          <button
            key={item.id}
            onClick={() => onMenuItemClick(item.id)}
            className="w-full px-4 py-3 flex items-center justify-between group hover:bg-slate-50/70 active:bg-slate-100/60 transition-colors duration-150 text-left cursor-pointer"
          >
            {/* Left Icon + Title/Subtitle */}
            <div className="flex items-center gap-3.5 min-w-0">
              {renderIcon(item.id)}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[12px] text-slate-400 font-normal mt-0.5 tracking-tight truncate">
                  {subtitleText}
                </span>
              </div>
            </div>

            {/* Right Chevron */}
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
          </button>
        );
      })}
    </div>
  );
};

