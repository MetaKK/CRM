import React, { useState } from 'react';
import { X, ShieldCheck, Check, Smartphone, Key, Fingerprint, Lock } from 'lucide-react';
import { AdvisorProfile } from '../../types';

interface AccountSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AdvisorProfile;
}

export const AccountSecurityModal: React.FC<AccountSecurityModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 select-none">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">账号与安全</h3>
              <p className="text-xs text-gray-400 mt-0.5">顾问身份认证及工作台权限管理</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 overflow-y-auto space-y-3.5 my-1 flex-1">
          {/* Identity Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] bg-white/20 px-2.5 py-0.5 rounded-full font-semibold">
                  认证销售顾问
                </span>
                <h4 className="font-bold text-lg mt-1">{profile.name}</h4>
                <p className="text-xs text-emerald-100 mt-0.5">顾问工号：{profile.advisorId}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
            </div>
          </div>

          {/* Settings List */}
          <div className="bg-gray-50/80 rounded-2xl border border-gray-100 divide-y divide-gray-100">
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4.5 h-4.5 text-gray-600" />
                <div>
                  <div className="text-xs font-bold text-gray-900">绑定手机号</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{profile.phone}</div>
                </div>
              </div>
              <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">
                更换
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fingerprint className="w-4.5 h-4.5 text-gray-600" />
                <div>
                  <div className="text-xs font-bold text-gray-900">Face ID / 指纹快捷登录</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">免密一秒切入系统</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={biometricEnabled}
                onChange={(e) => setBiometricEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-4.5 h-4.5 text-gray-600" />
                <div>
                  <div className="text-xs font-bold text-gray-900">修改登录密码</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">上次修改于 30 天前</div>
                </div>
              </div>
              <span className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline">
                修改
              </span>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-4.5 h-4.5 text-gray-600" />
                <div>
                  <div className="text-xs font-bold text-gray-900">数据调阅日志</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">符合商业保密与客户安全体系</div>
                </div>
              </div>
              <span className="text-xs text-gray-400">已保护</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#1a6fd4] hover:bg-[#155caf] text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
