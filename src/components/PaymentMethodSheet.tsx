import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface PaymentMethodSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'sbp' | 'sberPay' | 'tPay') => void;
  amount: number;
  energy: number;
}

export default function PaymentMethodSheet({
  isOpen,
  onClose,
  onSelectMethod,
  amount,
  energy
}: PaymentMethodSheetProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black text-white border-0 p-0 gap-0 overflow-hidden rounded-t-3xl [&>button]:hidden data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=closed]:duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-800 transition-colors"
          >
            <Icon name="X" size={20} className="text-gray-400" />
          </button>
          <h2 className="text-xl font-semibold mb-2">Выберите способ оплаты</h2>
          <p className="text-sm text-gray-400">
            Выберите удобный способ для совершения платежа
          </p>
        </div>

        {/* Payment methods */}
        <div className="px-6 pb-6 space-y-3">
          {/* СБП */}
          <button
            onClick={() => onSelectMethod('sbp')}
            className="w-full flex items-center gap-4 p-4 bg-gray-900 hover:bg-gray-800 rounded-2xl border border-gray-800 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Icon name="Zap" size={24} className="text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white text-base">СБП</p>
              <p className="text-sm text-gray-400">Система быстрых платежей</p>
            </div>
            <Icon name="ChevronRight" size={20} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
          </button>

          {/* SberPay */}
          <button
            onClick={() => onSelectMethod('sberPay')}
            className="w-full flex items-center gap-4 p-4 bg-gray-900 hover:bg-gray-800 rounded-2xl border border-gray-800 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Icon name="CreditCard" size={24} className="text-green-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white text-base">SberPay</p>
              <p className="text-sm text-gray-400">Оплата через Сбербанк</p>
            </div>
            <Icon name="ChevronRight" size={20} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
          </button>

          {/* T-Pay */}
          <button
            onClick={() => onSelectMethod('tPay')}
            className="w-full flex items-center gap-4 p-4 bg-gray-900 hover:bg-gray-800 rounded-2xl border border-gray-800 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <Icon name="Smartphone" size={24} className="text-yellow-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white text-base">T-Pay</p>
              <p className="text-sm text-gray-400">Оплата через Т-Банк</p>
            </div>
            <Icon name="ChevronRight" size={20} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}