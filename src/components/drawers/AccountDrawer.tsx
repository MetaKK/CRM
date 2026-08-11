import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Wallet,
  Star,
  UserPlus,
  Headphones,
  Smartphone,
  Settings,
  Sliders,
  QrCode,
  ChevronRight,
  Plus,
  LogOut,
  Store,
  Box,
  ShieldCheck,
  Bell,
  Check,
} from 'lucide-react';
import { RoleAccount } from '../../types';

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: RoleAccount[];
  activeAccountId: string;
  onSelectAccount: (accountId: string) => void;
  onOpenStoreSwitcher: () => void;
  onOpenAppCenter: () => void;
  onOpenCustomerService: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenAccountSecurity: () => void;
  onLogout: () => void;
}

export const AccountDrawer: React.FC<AccountDrawerProps> = ({
  isOpen,
  onClose,
  accounts,
  activeAccountId,
  onSelectAccount,
  onOpenStoreSwitcher,
  onOpenAppCenter,
  onOpenCustomerService,
  onOpenSettings,
  onOpenNotifications,
  onOpenAccountSecurity,
  onLogout,
}) => {
  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];
  const [signature, setSignature] = useState(activeAccount.signature);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex justify-center items-center select-none font-sans overflow-hidden">
          {/* H5 Container Overlay Bounds */}
          <div className="w-full max-w-md h-full relative flex justify-start">
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            />

            {/* Drawer Content Panel with Drag-to-Dismiss on H5 */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.5, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60 || info.velocity.x < -300) {
                  onClose();
                }
              }}
              className="relative z-10 w-[88%] max-w-[340px] h-full bg-[#f8fbff] shadow-2xl flex overflow-hidden touch-pan-y"
            >
              {/* COLUMN 1: LEFTMOST VERTICAL ACCOUNT SWITCHER BAR */}
              <div className="w-[68px] sm:w-[72px] bg-slate-100/95 border-r border-slate-200/70 py-4 sm:py-5 px-1 flex flex-col items-center justify-between shrink-0 overflow-y-auto no-scrollbar touch-pan-y">
                {/* Accounts Stack */}
                <div className="w-full space-y-3.5 flex flex-col items-center">
                  {accounts.map((acc) => {
                    const isActive = acc.id === activeAccountId;

                    return (
                      <button
                        key={acc.id}
                        onClick={() => {
                          onSelectAccount(acc.id);
                          setSignature(acc.signature);
                          onClose();
                        }}
                        className="group relative flex flex-col items-center gap-1 w-full cursor-pointer transition-all active:scale-95"
                      >
                        {/* Icon Square */}
                        <div className="relative">
                          {isActive && (
                            <span className="absolute -left-2 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-600 shadow-xs" />
                          )}
                          <div
                            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center relative shadow-2xs transition-all ${
                              acc.iconBg
                            } ${
                              isActive
                                ? 'scale-105 shadow-[0_3px_10px_rgba(26,111,212,0.25)]'
                                : 'opacity-80 group-hover:opacity-100'
                            }`}
                          >
                            <span className={`text-[10px] sm:text-[11px] font-bold leading-none ${acc.iconText}`}>
                              {acc.avatarText || (acc.shortName.length > 2 ? acc.shortName.slice(0, 2) : acc.shortName)}
                            </span>

                            {/* Unread badge dot */}
                            {acc.unreadCount && acc.unreadCount > 0 ? (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                            ) : null}
                          </div>
                        </div>

                        {/* Label below icon */}
                        <span
                          className={`text-[9px] tracking-tight leading-tight text-center max-w-[56px] truncate ${
                            isActive ? 'text-blue-700 font-bold' : 'text-slate-500 font-normal'
                          }`}
                        >
                          {acc.shortName}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Login More Accounts Button */}
                <button
                  onClick={() => alert(`暂已支持 ${accounts.length} 个全功能体验账号切换！`)}
                  className="flex flex-col items-center gap-1 w-full pt-3 border-t border-slate-200/80 cursor-pointer hover:text-blue-600 active:scale-95 transition-all mt-3"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border border-slate-300 text-slate-600 flex items-center justify-center shadow-2xs">
                    <Plus className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="text-[9px] text-slate-500 text-center leading-tight">
                    登录更多
                  </span>
                </button>
              </div>

              {/* COLUMN 2: RIGHT MAIN MY PROFILE & FUNCTIONS PANEL */}
              <div className="flex-1 flex flex-col h-full bg-[linear-gradient(175deg,#dce9f6_0%,#eaf2fb_40%,#f4f8fd_100%)] overflow-y-auto touch-pan-y no-scrollbar">
                {/* Profile Card Header */}
                <div className="p-3.5 sm:p-4 border-b border-[#d6e3f1] bg-[linear-gradient(160deg,#c6d8ef_0%,#ddeaf8_100%)] relative">
                  {/* Quick Close Button for Mobile H5 */}
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer z-10"
                    title="关闭"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>

                  <div className="flex justify-between items-start pr-6">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-lime-500 via-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md border-2 border-white">
                        <User className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                      </div>
                    </div>

                    {/* Top Right Status Pill */}
                    <button
                      onClick={() => alert('已被设置为【在线在岗】状态')}
                      className="px-2 py-0.5 rounded-full border border-blue-500/30 text-blue-600 text-[11px] font-medium bg-blue-50/60 hover:bg-blue-100 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      状态
                    </button>
                  </div>

                  {/* Name & QR */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between pr-2">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                          {activeAccount.name}
                        </h3>
                        <button
                          onClick={() => alert(`当前账号编码：${activeAccount.id.toUpperCase()}`)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={onOpenAccountSecurity}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Subtag Verified */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium truncate max-w-[120px]">
                        {activeAccount.store}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                          activeAccount.verified
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {activeAccount.verified ? '已认证' : '未认证'}
                      </span>
                    </div>

                    {/* Signature Input */}
                    <input
                      type="text"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      placeholder="输入你的个性签名..."
                      className="w-full mt-2.5 px-3 py-1.5 text-xs rounded-xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200/80 text-slate-800 placeholder-slate-400 outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-normal"
                    />
                  </div>
                </div>

              {/* Streamlined Function List Menu (Enterprise H5 Best Practices) */}
              <div className="flex-1 p-2.5 space-y-1.5 overflow-y-auto no-scrollbar">
                {/* 1. Store Switcher */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenStoreSwitcher();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Store className="w-4 h-4 text-indigo-600 stroke-[2]" />
                    <span className="text-xs font-semibold text-slate-800">切换门店</span>
                  </div>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium truncate max-w-[110px]">
                    {activeAccount.store}
                  </span>
                </button>

                {/* 2. App Center */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenAppCenter();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Box className="w-4 h-4 text-blue-600 stroke-[2]" />
                    <span className="text-xs font-semibold text-slate-800">应用中心</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-medium">12款工具</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </button>

                {/* 3. Personal Card & Marketing Assets */}
                <button
                  onClick={() => alert('个人名片与营销话术已准备就绪')}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-emerald-600 stroke-[2]" />
                    <span className="text-xs font-semibold text-slate-800">名片与素材</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>

                {/* 4. Notifications & Customer Support */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenNotifications();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-amber-500 stroke-[2]" />
                    <span className="text-xs font-semibold text-slate-800">消息与帮助</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold">
                      3
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </button>

                {/* 5. Preferences & Settings */}
                <button
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-slate-600 stroke-[2]" />
                    <span className="text-xs font-semibold text-slate-800">系统设置</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>
              </div>

              {/* Logout */}
              <div className="p-3 border-t border-slate-100 mt-auto">
                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="w-full py-2.5 rounded-xl border border-rose-200/80 text-rose-600 bg-rose-50/50 hover:bg-rose-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  退出登录
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      )}
    </AnimatePresence>
  );
};
