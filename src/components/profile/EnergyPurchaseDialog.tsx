import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import Icon from '@/components/ui/icon';

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
  onPurchase: () => void;
}

export default function EnergyPurchaseDialog({
  isOpen,
  onClose,
  profile,
  energyAmount,
  onEnergyAmountChange,
  onPurchase
}: EnergyPurchaseDialogProps) {
  const calculatePrice = (rubles: number) => {
    const discountPercent = ((rubles - 500) / (10000 - 500)) * 30;
    const baseEnergy = rubles;
    const bonus = Math.floor(baseEnergy * (discountPercent / 100));
    return { energy: baseEnergy + bonus, discount: Math.round(discountPercent) };
  };

  const { energy, discount } = calculatePrice(energyAmount);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Zap" className="text-yellow-500" />
            Пополнение энергии
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg">
            <span className="text-sm text-muted-foreground">Текущий баланс:</span>
            <div className="flex items-center gap-1.5">
              <Icon name="Zap" size={16} className="text-yellow-500" />
              <span className="font-bold text-lg">{profile?.energy || 0}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Сумма пополнения</label>
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
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{energyAmount}₽</div>
                  <div className="text-xs text-muted-foreground">К оплате</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <Icon name="Zap" size={20} className="text-yellow-500" />
                    <span className="text-2xl font-bold text-yellow-600">+{energy}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {discount > 0 && (
                      <span className="text-green-600 font-medium">
                        +{discount}% бонус
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {discount > 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
                  <Icon name="TrendingUp" size={16} className="text-green-500" />
                  <span className="text-sm text-green-600 font-medium">
                    Экономия {discount}% — дополнительно +{energy - energyAmount} энергии!
                  </span>
                </div>
              )}

              {discount < 30 && (
                <div className="text-xs text-muted-foreground text-center">
                  💡 При покупке на 10 000₽ скидка достигает 30%
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={onPurchase}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 hover:from-yellow-600 hover:via-orange-600 hover:to-pink-600"
          >
            <Icon name="ShoppingCart" size={20} className="mr-2" />
            Пополнить на {energyAmount}₽
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
