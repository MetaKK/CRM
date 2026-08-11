import React, { useState } from 'react';
import { X, Headphones, Phone, Send, CheckCircle2, MessageSquare, ShieldAlert } from 'lucide-react';

interface CustomerServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  advisorName: string;
  storeName: string;
}

export const CustomerServiceModal: React.FC<CustomerServiceModalProps> = ({
  isOpen,
  onClose,
  advisorName,
  storeName,
}) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFeedbackText('');
      onClose();
    }, 1800);
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
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Headphones className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">顾问专属支持</h3>
              <p className="text-xs text-gray-400 mt-0.5">{storeName} · 销售中台服务</p>
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
        <div className="py-4 overflow-y-auto space-y-4 my-1 flex-1">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h4 className="font-bold text-gray-900 text-base">问题已成功提交</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                总部运营团队已收到您的反馈，将在15分钟内与您联系。
              </p>
            </div>
          ) : (
            <>
              {/* Hotlines */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="tel:0553-8889999"
                  className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100/80 flex flex-col justify-between hover:bg-blue-100/70 transition-colors"
                >
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                    <Phone className="w-4 h-4" />
                    <span>体验中心客服</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 mt-2">0553-8889999</div>
                  <span className="text-[10px] text-gray-400 mt-0.5">8:30 - 20:30 直连分机</span>
                </a>

                <button
                  onClick={() => alert(`已紧急通知【${storeName}】值班经理，稍后将通过系统消息与您沟通。`)}
                  className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-100/80 flex flex-col justify-between hover:bg-rose-100/70 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>店长/值班经理</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 mt-2">189 0553 9999</div>
                  <span className="text-[10px] text-rose-400 mt-0.5">特批底价 / 交易协助</span>
                </button>
              </div>

              {/* Feedback Form */}
              <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>意见反馈与系统报修</span>
                </div>

                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="请输入您在日常使用或接单过程中遇到的任何疑问或建议..."
                  className="w-full text-xs p-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-blue-500 text-gray-800 placeholder-gray-400 resize-none"
                />

                <button
                  type="submit"
                  disabled={!feedbackText.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>提交反馈给运营支持</span>
                </button>
              </form>
            </>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#1a6fd4] hover:bg-[#155caf] text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
};
