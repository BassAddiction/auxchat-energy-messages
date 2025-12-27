import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import Icon from '@/components/ui/icon';
import { useState } from 'react';
import PaymentMethodSheet from '@/components/PaymentMethodSheet';

interface UserProfile {
  id: number;
  username: string;
  avatar: string;
  bio: string;
  status: string;
  energy: number;
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
}

interface EnergyPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  energyAmount: number;
  onEnergyAmountChange: (value: number) => void;
  onPurchase: (method: 'sbp' | 'sberPay' | 'tPay') => void;
}

export default function EnergyPurchaseDialog({
  isOpen,
  onClose,
  profile,
  energyAmount,
  onEnergyAmountChange,
  onPurchase
}: EnergyPurchaseDialogProps) {
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  const calculatePrice = (rubles: number) => {
    const discountPercent = ((rubles - 500) / (10000 - 500)) * 30;
    const baseEnergy = rubles;
    const bonus = Math.floor(baseEnergy * (discountPercent / 100));
    return { energy: baseEnergy + bonus, discount: Math.round(discountPercent) };
  };

  const { energy, discount } = calculatePrice(energyAmount);

  const handlePaymentSelect = (method: 'sbp' | 'sberPay' | 'tPay') => {
    onPurchase(method);
    setShowPaymentMethods(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-gray-900 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Icon name="Zap" className="text-yellow-400" />
              Пополнение энергии
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <span className="text-sm text-gray-400">Текущий баланс:</span>
              <div className="flex items-center gap-1.5">
                <Icon name="Zap" size={16} className="text-yellow-400" />
                <span className="font-bold text-lg text-white">{profile?.energy || 0}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Сумма пополнения</label>
                <Slider
                  value={[energyAmount]}
                  onValueChange={([value]) => onEnergyAmountChange(value)}
                  min={500}
                  max={10000}
                  step={100}
                  className="py-4"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg border border-purple-500/30">
                  <div>
                    <div className="text-2xl font-bold text-purple-400">{energyAmount}₽</div>
                    <div className="text-xs text-gray-400">К оплате</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <Icon name="Zap" size={20} className="text-yellow-400" />
                      <span className="text-2xl font-bold text-yellow-400">+{energy}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {discount > 0 && (
                        <span className="text-green-400 font-medium">
                          +{discount}% бонус
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {discount > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                    <Icon name="TrendingUp" size={16} className="text-green-400" />
                    <span className="text-sm text-green-400 font-medium">
                      Экономия {discount}% — дополнительно +{energy - energyAmount} энергии!
                    </span>
                  </div>
                )}

                {discount < 30 && (
                  <div className="text-xs text-gray-500 text-center">
                    💡 При покупке на 10 000₽ скидка достигает 30%
                  </div>
                )}
              </div>
            </div>

            <Button 
              onClick={() => setShowPaymentMethods(true)}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 hover:from-yellow-600 hover:via-orange-600 hover:to-pink-600 text-white"
            >
              <Icon name="ShoppingCart" size={20} className="mr-2" />
              Пополнить на {energyAmount}₽
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentMethodSheet
        isOpen={showPaymentMethods}
        onClose={() => setShowPaymentMethods(false)}
        onSelectMethod={handlePaymentSelect}
        amount={energyAmount}
        energy={energy}
      />
    </>
  );
}