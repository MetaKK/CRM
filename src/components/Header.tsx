import React from 'react';
import { Search, Bell, Plus } from 'lucide-react';
import { RoleAccount } from '../types';

interface HeaderProps {
  currentAccount: RoleAccount;
  onOpenAccountDrawer: () => void;
  onOpenCustomerService?: () => void;
  onOpenSettings?: () => void;
  onOpenNotifications?: () => void;
  onQuickAction?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentAccount,
  onOpenAccountDrawer,
  onOpenNotifications,
  onQuickAction,
}) => {
  return (
    <header className="sticky top-0 w-full pt-10 pb-4 px-5 flex justify-between items-center select-none z-30 bg-transparent transition-all">
      {/* Left Account Switcher Trigger Profile Section - Native iOS Interactive Target */}
      <button
        onClick={onOpenAccountDrawer}
        className="flex items-center gap-3 group cursor-pointer active:opacity-60 transition-opacity p-0.5 rounded-2xl"
        title="点击展开账户切换与个人设置"
      >
        {/* Dark Teal Brand Avatar Badge */}
        <div className="relative shrink-0">
          <div className="w-[52px] h-[52px] rounded-full bg-[linear-gradient(145deg,#1b7e76,#0f5c56)] text-white flex items-center justify-center shadow-[0_3px_12px_rgba(18,96,113,0.22)] border-2 border-white/50">
            <span className="text-[14px] font-bold tracking-tight leading-none text-white">
              {currentAccount.shortName.length > 2
                ? currentAccount.shortName.slice(0, 2)
                : currentAccount.shortName}
            </span>
          </div>

          {currentAccount.unreadCount && currentAccount.unreadCount > 0 ? (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#ff3b30] rounded-full ring-2 ring-white animate-pulse" />
          ) : null}
        </div>

        {/* User Name, Role & Department */}
        <div className="text-left leading-tight">
          <div className="flex items-center gap-1">
            <h1 className="text-[18px] font-bold text-slate-900 tracking-tight group-hover:text-[#1a6fd4] transition-colors">
              {currentAccount.name}
            </h1>
            <span className="text-[14px] font-normal text-slate-600">
              （{currentAccount.roleTitle}）
            </span>
          </div>
          <p className="text-[13px] text-slate-500 font-normal mt-0.5 tracking-tight truncate max-w-[160px]">
            {currentAccount.store ? currentAccount.store.slice(0, 12) : '销售部门'}
          </p>
        </div>
      </button>

      {/* Right Action Icons matching iOS Native Action Targets */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button
          onClick={() => alert('已搜索：意向客户、车辆库存、试驾排期与销售话术')}
          className="crm-icon-button w-7 h-7 flex items-center justify-center cursor-pointer"
          title="搜索"
        >
          <Search className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="crm-icon-button w-7 h-7 flex items-center justify-center cursor-pointer relative"
          title="消息通知"
        >
          <Bell className="w-4 h-4 stroke-[2.2]" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#f04040] rounded-full ring-2 ring-white" />
        </button>

        {/* Quick Add Plus */}
        <button
          onClick={onQuickAction}
          className="crm-icon-button w-7 h-7 flex items-center justify-center cursor-pointer"
          title="快捷添加"
        >
          <Plus className="w-6 h-6 stroke-[2]" />
        </button>
      </div>
    </header>
  );
};


