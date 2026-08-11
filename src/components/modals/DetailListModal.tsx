import React, { useState } from 'react';
import { X, Search, Phone, Calendar, Clock, FileText, Users, CheckCircle2, ChevronRight, Plus } from 'lucide-react';
import { mockClients, mockTestDrives, mockOrders } from '../../data/mockData';
import { MetricData } from '../../types';

interface DetailListModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: MetricData['id'] | null;
}

export const DetailListModal: React.FC<DetailListModalProps> = ({
  isOpen,
  onClose,
  metricType,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen || !metricType) return null;

  const getTitle = () => {
    switch (metricType) {
      case 'clients':
        return { title: '本月客户 (128人)', subtitle: '顾问私域及店端分配全量线索库' };
      case 'testDrives':
        return { title: '试驾预约 (36场)', subtitle: '已安排与待确认的深度试驾排班' };
      case 'followUps':
        return { title: '跟进中客户 (24人)', subtitle: '重点意向及3日内计划二次试驾客户' };
      case 'orders':
        return { title: '成交订单 (12单)', subtitle: '本月已签署合同样本与交车进度' };
    }
  };

  const headerInfo = getTitle();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 select-none">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{headerInfo.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{headerInfo.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索客户姓名、手机号或车型..."
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
          />
        </div>

        {/* List content */}
        <div className="py-3 overflow-y-auto space-y-3 my-1 flex-1">
          {metricType === 'clients' || metricType === 'followUps' || metricType === 'followingUp' ? (
            mockClients
              .filter(
                (c) =>
                  (metricType !== 'followUps' && metricType !== 'followingUp') ||
                  c.status === '需求确认' ||
                  c.status === '待试驾' ||
                  c.status === '方案报价'
              )
              .map((client) => (
                <div
                  key={client.id}
                  className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${client.avatarBg} text-white font-bold flex items-center justify-center text-sm shadow-xs`}
                    >
                      {client.name.substring(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{client.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">
                          {client.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{client.intentCar}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        联系时间: {client.lastContact} · 预算: {client.budget}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`tel:${client.phone}`}
                    className="p-2.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              ))
          ) : metricType === 'testDrives' ? (
            mockTestDrives.map((td) => (
              <div
                key={td.id}
                className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{td.clientName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">
                        {td.status}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">{td.carModel}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">预约时间: {td.timeSlot}</p>
                  </div>
                </div>

                <button
                  onClick={() => alert(`已向客户 ${td.clientName} 发送试驾确认短信与钥匙准备提醒！`)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer hover:bg-emerald-700 shadow-xs"
                >
                  开始试驾
                </button>
              </div>
            ))
          ) : (
            mockOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all space-y-2"
              >
                <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                  <span className="text-xs font-mono font-bold text-gray-500">
                    单号: {ord.orderNo}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold rounded-full">
                    {ord.status}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{ord.clientName}</h4>
                    <p className="text-xs text-gray-600 font-medium">{ord.carModel}</p>
                    <p className="text-[10px] text-gray-400">{ord.color}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-blue-600">{ord.totalPrice}</div>
                    <p className="text-[10px] text-gray-400">已付定金: {ord.deposit}</p>
                  </div>
                </div>
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
            返回
          </button>
        </div>
      </div>
    </div>
  );
};
