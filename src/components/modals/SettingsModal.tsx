import React, { useState } from 'react';
import { X, Hexagon, Volume2, Vibrate, Trash2, Smartphone, RefreshCw, Moon } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetWorkbenchDemo: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onResetWorkbenchDemo }) => {
  const [haptic, setHaptic] = useState(true);
  const [sound, setSound] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [clearing, setClearing] = useState(false);

  if (!isOpen) return null;

  const handleClearCache = () => {
    setClearing(true);
    setTimeout(() => {
      setClearing(false);
      alert('已清理工作台本地缓存 14.2 MB！');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 select-none">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
              <Hexagon className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">设置</h3>
              <p className="text-xs text-gray-400 mt-0.5">通用设置与系统偏好配置</p>
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
          <div className="bg-gray-50/80 rounded-2xl border border-gray-100 divide-y divide-gray-100">
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Vibrate className="w-4.5 h-4.5 text-gray-600" />
                <div>
                  <div className="text-xs font-bold text-gray-900">触感反馈 (振动)</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">按键与状态切换物理反馈</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={haptic}
                onChange={(e) => setHaptic(e.target.checked)}
                className="w-4 h-4 accent-purple-600 cursor-pointer"
              />
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4.5 h-4.5 text-gray-600" />
                <div>
                  <div className="text-xs font-bold text-gray-900">系统提示音</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">新线索派发与接单铃声</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={sound}
                onChange={(e) => setSound(e.target.checked)}
                className="w-4 h-4 accent-purple-600 cursor-pointer"
              />
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-4.5 h-4.5 text-gray-600" />
                <div>
                  <div className="text-xs font-bold text-gray-900">护眼夜间模式</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">自动匹配手机系统深色主题</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
                className="w-4 h-4 accent-purple-600 cursor-pointer"
              />
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trash2 className="w-4.5 h-4.5 text-gray-600" />
                <div>
                  <div className="text-xs font-bold text-gray-900">清除本地数据缓存</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">已用 14.2 MB</div>
                </div>
              </div>
              <button
                onClick={handleClearCache}
                disabled={clearing}
                className="text-xs text-rose-600 font-semibold cursor-pointer hover:underline flex items-center gap-1"
              >
                {clearing && <RefreshCw className="w-3 h-3 animate-spin" />}
                清理
              </button>
            </div>

            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4.5 h-4.5 text-gray-600" />
                <div>
                  <div className="text-xs font-bold text-gray-900">重置工作台演示</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">恢复事项状态，保留布局和工作必备</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onResetWorkbenchDemo}
                className="min-h-8 text-xs font-semibold text-[#1a6fd4] cursor-pointer hover:underline"
              >
                重置
              </button>
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>安奇智驾营销 H5 工作台</span>
            </div>
            <span className="font-bold text-blue-600">v3.8.2 最新版</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#1a6fd4] hover:bg-[#155caf] text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            保存并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
