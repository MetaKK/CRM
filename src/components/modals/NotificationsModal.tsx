import React, { useState } from 'react';
import { X, Bell, CheckCheck, Calendar, Users, FileText, Info } from 'lucide-react';
import { mockNotifications } from '../../data/mockData';
import { NotificationItem } from '../../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [activeTab, setActiveTab] = useState<'all' | 'testDrive' | 'client' | 'order'>('all');

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isUnread: false })));
  };

  const filtered = notifications.filter((item) => {
    if (activeTab === 'all') return true;
    return item.type === activeTab;
  });

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'testDrive':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'client':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'order':
        return <FileText className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-purple-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 select-none">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
              <Bell className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">消息通知</h3>
              <p className="text-xs text-gray-400 mt-0.5">系统提醒、线索派发与试驾通知</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Header bar */}
        <div className="flex justify-between items-center py-2.5 px-1 border-b border-gray-100/60">
          <div className="flex items-center gap-1.5 text-xs">
            {[
              { id: 'all', label: '全部' },
              { id: 'testDrive', label: '试驾' },
              { id: 'client', label: '客户' },
              { id: 'order', label: '订单' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleMarkAllRead}
            className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            全部已读
          </button>
        </div>

        {/* Notifications List */}
        <div className="py-3 overflow-y-auto space-y-3 my-1 flex-1">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-xs">暂无该分类通知</div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  item.isUnread
                    ? 'bg-blue-50/40 border-blue-100 shadow-2xs'
                    : 'bg-gray-50/60 border-gray-100/80 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white shadow-2xs">
                      {getNotificationIcon(item.type)}
                    </div>
                    <span className="font-bold text-gray-900 text-xs tracking-tight">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{item.time}</span>
                </div>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">{item.content}</p>
              </div>
            ))
          )}
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
