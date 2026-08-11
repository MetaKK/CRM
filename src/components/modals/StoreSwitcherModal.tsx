import React from 'react';
import { X, Check, MapPin, Phone, Star } from 'lucide-react';
import { StoreOption } from '../../types';

interface StoreSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: StoreOption[];
  currentStoreId: string;
  onSelectStore: (store: StoreOption) => void;
}

export const StoreSwitcherModal: React.FC<StoreSwitcherModalProps> = ({
  isOpen,
  onClose,
  stores,
  currentStoreId,
  onSelectStore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 select-none">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">切换服务门店</h3>
            <p className="text-xs text-gray-400 mt-0.5">选择您当前就职或值班的体验中心</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Store List */}
        <div className="py-3 overflow-y-auto space-y-3 my-1 flex-1">
          {stores.map((store) => {
            const isSelected = store.name === currentStoreId || store.id === currentStoreId;

            return (
              <div
                key={store.id}
                onClick={() => {
                  onSelectStore(store);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col gap-2 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-base">{store.name}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-amber-500 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {store.rating}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{store.address}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-100/60 mt-1">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {store.phone}
                  </span>
                  {isSelected ? (
                    <span className="text-blue-600 font-semibold text-[11px]">当前体验中心</span>
                  ) : (
                    <span className="text-gray-400 text-[11px]">点击切换</span>
                  )}
                </div>
              </div>
            );
          })}
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
