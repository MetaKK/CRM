import React from 'react';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  onLogout: () => void;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout }) => {
  return (
    <div className="mx-4 my-2.5 select-none">
      <button
        onClick={onLogout}
        className="w-full py-3 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-100/80 flex items-center justify-center gap-2 text-[#ef4444] hover:bg-rose-50/40 active:scale-98 transition-all cursor-pointer group"
      >
        <LogOut className="w-4 h-4 stroke-[2.2] group-hover:scale-105 transition-transform" />
        <span className="text-[15px] font-medium tracking-tight">退出登录</span>
      </button>
    </div>
  );
};

