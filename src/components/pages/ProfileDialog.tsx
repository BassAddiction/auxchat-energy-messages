import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import Icon from "@/components/ui/icon";
import { FUNCTIONS } from "@/lib/func2url";
import { User } from "@/types";
import { calculatePrice } from "@/lib/indexHelpers";

interface ProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  userId: number | null;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  profilePhotos: { id: number; url: string }[];
  onLoadPhotos: () => void;
  uploadingFile: boolean;
  uploadProgress: string;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDeletePhoto: (photoId: number) => Promise<void>;
  onSetMainPhoto: (photoId: number) => Promise<void>;
  onOpenPhotoViewer: (index: number) => void;
  userLocation: { lat: number; lon: number; city: string } | null;
  updatingLocation: boolean;
  onRequestGeolocation: () => Promise<void>;
  energyAmount: number;
  onEnergyAmountChange: (amount: number) => void;
  onAddEnergy: (amount: number) => Promise<void>;
}

export default function ProfileDialog({
  isOpen,
  onOpenChange,
  user,
  userId,
  onUpdateUser,
  onLogout,
  profilePhotos,
  uploadingFile,
  uploadProgress,
  onPhotoUpload,
  onDeletePhoto,
  onSetMainPhoto,
  onOpenPhotoViewer,
  userLocation,
  updatingLocation,
  onRequestGeolocation,
  energyAmount,
  onEnergyAmountChange,
  onAddEnergy,
}: ProfileDialogProps) {
  const navigate = useNavigate();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const { energy: calculatedEnergy, discount } = calculatePrice(energyAmount);

  const handleUpdateUsername = () => {
    if (user && newUsername.trim()) {
      onUpdateUser({ ...user, username: newUsername.trim() });
      setIsEditingUsername(false);
      setNewUsername("");
    }
  };

  const handleUpdateStatus = async () => {
    if (!user || !newStatus.trim() || !userId) return;

    try {
      const response = await fetch(FUNCTIONS["update-profile"], {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId.toString(),
        },
        body: JSON.stringify({ status: newStatus.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        onUpdateUser({ ...user, status: data.status });
        setIsEditingStatus(false);
        setNewStatus("");
      } else {
        alert("Не удалось обновить статус");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Ошибка при обновлении статуса");
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-1.5 md:px-2">
          <Avatar className="h-6 w-6 md:h-7 md:w-7">
            <AvatarImage src={user.avatar} alt={user.username} />
            <AvatarFallback>{user.username[0]}</AvatarFallback>
          </Avatar>
          <span className="ml-1 md:ml-1.5 text-xs md:text-sm max-w-[60px] md:max-w-none truncate">
            {user.username}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Профиль</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pb-4">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <Avatar className="h-20 w-20 bg-gray-100">
                <AvatarImage
                  src={user.avatar}
                  alt={user.username}
                  className="object-contain"
                />
                <AvatarFallback>{user.username[0]}</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              {isEditingUsername ? (
                <div className="flex gap-2">
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Новое имя"
                  />
                  <Button size="sm" onClick={handleUpdateUsername}>
                    <Icon name="Check" size={16} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{user.username}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNewUsername(user.username);
                      setIsEditingUsername(true);
                    }}
                  >
                    <Icon name="Edit2" size={16} />
                  </Button>
                </div>
              )}

              {isEditingStatus ? (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    placeholder="Ваш статус"
                    className="text-sm"
                    maxLength={100}
                  />
                  <Button size="sm" onClick={handleUpdateStatus}>
                    <Icon name="Check" size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingStatus(false);
                      setNewStatus("");
                    }}
                  >
                    <Icon name="X" size={16} />
                  </Button>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 mt-1 cursor-pointer group"
                  onClick={() => {
                    setNewStatus(user.status || "");
                    setIsEditingStatus(true);
                  }}
                >
                  <p className="text-sm text-muted-foreground italic">
                    {user.status || "Добавить статус..."}
                  </p>
                  <Icon
                    name="Edit2"
                    size={14}
                    className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
              <Icon name="Zap" className="text-yellow-500" size={24} />
              <div className="flex-1">
                <p className="font-semibold">{user.energy} энергии</p>
                <p className="text-xs text-muted-foreground">
                  1 сообщение = 10 энергии
                </p>
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

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {energyAmount}₽
                  </div>
                  <div className="text-xs text-muted-foreground">К оплате</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <Icon name="Zap" size={20} className="text-yellow-500" />
                    <span className="text-2xl font-bold text-yellow-600">
                      +{calculatedEnergy}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="text-xs text-green-600 font-medium">
                      +{discount}% бонус
                    </div>
                  )}
                </div>
              </div>

              {discount > 0 && (
                <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
                  <Icon name="TrendingUp" size={14} className="text-green-500" />
                  <span className="text-xs text-green-600 font-medium">
                    Экономия {discount}% — дополнительно +
                    {calculatedEnergy - energyAmount} энергии!
                  </span>
                </div>
              )}

              {discount < 30 && (
                <div className="text-xs text-muted-foreground text-center">
                  💡 При покупке на 10 000₽ получите +30% энергии!
                </div>
              )}

              <Button
                onClick={() => onAddEnergy(energyAmount)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
              >
                <Icon name="Zap" size={18} className="mr-2" />
                Пополнить {calculatedEnergy} энергии за {energyAmount}₽
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">
              Фотографии ({profilePhotos.length}/6)
            </h3>

            {profilePhotos.length < 6 && (
              <div className="mb-4 space-y-2">
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPhotoUpload}
                    className="hidden"
                    disabled={uploadingFile}
                  />
                  <Button
                    asChild
                    disabled={uploadingFile}
                    className="w-full bg-black text-white hover:bg-black/90"
                  >
                    <span className="cursor-pointer flex items-center justify-center">
                      {uploadingFile ? (
                        <>
                          <Icon
                            name="Loader2"
                            size={20}
                            className="mr-2 animate-spin"
                          />
                          Загрузка...
                        </>
                      ) : (
                        <>
                          <Icon name="Upload" size={20} className="mr-2" />
                          Загрузить фото
                        </>
                      )}
                    </span>
                  </Button>
                </label>
                {uploadProgress && (
                  <div className="space-y-1">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      {uploadProgress}
                    </p>
                  </div>
                )}
              </div>
            )}

            {profilePhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {profilePhotos.slice(0, 3).map((photo, index) => (
                  <div key={photo.id} className="relative group aspect-square">
                    {index === 0 && (
                      <div className="absolute top-1 left-1 px-2 py-0.5 bg-blue-500 rounded-full z-10">
                        <span className="text-[10px] text-white font-semibold">
                          Главное
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => onOpenPhotoViewer(index)}
                      className="w-full h-full"
                    >
                      <img
                        src={photo.url}
                        alt="Photo"
                        className="w-full h-full object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                      />
                    </button>
                    <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {index !== 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetMainPhoto(photo.id);
                          }}
                          className="flex-1 p-1 bg-blue-500/90 rounded text-white hover:bg-blue-600"
                          title="Сделать главным"
                        >
                          <Icon name="Star" size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePhoto(photo.id);
                        }}
                        className="flex-1 p-1 bg-red-500/90 rounded text-white hover:bg-red-600"
                        title="Удалить"
                      >
                        <Icon name="Trash2" size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Добавьте фото
              </p>
            )}
            {profilePhotos.length > 3 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onOpenPhotoViewer(0)}
              >
                <Icon name="Image" size={14} className="mr-2" />
                Показать все фото ({profilePhotos.length})
              </Button>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Местоположение</h3>
            {userLocation ? (
              <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                <Icon name="MapPin" size={14} className="text-green-600" />
                <span>{userLocation.city || "Установлено"}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-yellow-700 mb-2">
                <Icon name="AlertCircle" size={14} className="text-yellow-600" />
                <span>Не установлено</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await onRequestGeolocation();
              }}
              disabled={updatingLocation}
            >
              {updatingLocation ? (
                <>
                  <Icon
                    name="Loader2"
                    size={14}
                    className="mr-2 animate-spin"
                  />
                  Определяем...
                </>
              ) : (
                <>
                  <Icon name="MapPin" size={14} className="mr-2" />
                  {userLocation ? "Обновить" : "Установить"}
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                navigate("/blacklist");
              }}
            >
              <Icon name="Ban" size={16} className="mr-2" />
              Черный список
            </Button>
            <Button variant="outline" className="w-full" onClick={onLogout}>
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
