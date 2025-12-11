import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { FUNCTIONS } from '@/lib/func2url';

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

interface Photo {
  id: number;
  url: string;
  created_at: string;
}

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [checkingBlock, setCheckingBlock] = useState(false);
  const [energyModalOpen, setEnergyModalOpen] = useState(false);
  const [energyAmount, setEnergyAmount] = useState(500);

  const currentUserId = localStorage.getItem('auxchat_user_id');
  const isOwnProfile = String(currentUserId) === String(userId);

  // Расчет цены с прогрессивной скидкой до 30%
  const calculatePrice = (rubles: number) => {
    // От 500₽ (0% скидка) до 10000₽ (30% скидка)
    const discountPercent = ((rubles - 500) / (10000 - 500)) * 30;
    const baseEnergy = rubles; // 1₽ = 1 энергия
    const bonus = Math.floor(baseEnergy * (discountPercent / 100));
    return { energy: baseEnergy + bonus, discount: Math.round(discountPercent) };
  };

  const { energy, discount } = calculatePrice(energyAmount);

  const updateActivity = async () => {
    try {
      // FUNCTION: update-activity - Обновление времени последней активности
      await fetch('https://functions.poehali.dev/a70b420b-cb23-4948-9a56-b8cefc96f976', {
        method: 'POST',
        headers: { 'X-User-Id': currentUserId || '0' }
      });
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const handleEnergyPurchase = async () => {
    try {
      // FUNCTION: add-energy - Добавление энергии (покупка)
      const response = await fetch(FUNCTIONS['add-energy'], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId || '0'
        },
        body: JSON.stringify({ 
          energy_amount: energy,
          price: energyAmount 
        })
      });

      if (response.ok) {
        toast.success(`Получено ${energy} энергии за ${energyAmount}₽!`);
        setEnergyModalOpen(false);
        loadProfile();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Ошибка покупки');
      }
    } catch (error) {
      toast.error('Ошибка покупки энергии');
    }
  };

  useEffect(() => {
    if (!currentUserId) {
      navigate('/');
      return;
    }
    // Принудительно сбрасываем застрявшее состояние загрузки
    setUploadingFile(false);
    updateActivity();
    loadProfile();
    loadPhotos();
    if (!isOwnProfile) {
      checkBlockStatus();
    }
    const activityInterval = setInterval(updateActivity, 60000);
    return () => clearInterval(activityInterval);
  }, [userId]);

  const loadProfile = async () => {
    try {
      // FUNCTION: get-user - Получение данных профиля пользователя
      const response = await fetch(
        `${FUNCTIONS['get-user']}?user_id=${userId}`
      );
      const data = await response.json();
      
      // FUNCTION: profile-photos - Получение фотографий пользователя для аватара
      const photosResponse = await fetch(
        `${FUNCTIONS['profile-photos']}?userId=${userId}`,
        {
          headers: { 'X-User-Id': currentUserId || '0' }
        }
      );
      const photosData = await photosResponse.json();
      const userAvatar = photosData.photos && photosData.photos.length > 0 
        ? photosData.photos[0].url 
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`;
      
      setProfile({ ...data, avatar: userAvatar });
    } catch (error) {
      toast.error('Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    try {
      // FUNCTION: profile-photos - Получение всех фотографий пользователя
      const response = await fetch(
        `${FUNCTIONS['profile-photos']}?userId=${userId}`,
        {
          headers: {
            'X-User-Id': currentUserId || '0'
          }
        }
      );
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const addPhotoByUrl = async () => {
    if (!photoUrl.trim()) return;

    setIsAddingPhoto(true);
    try {
      // FUNCTION: profile-photos - Добавление фото по URL
      const encodedUrl = encodeURIComponent(photoUrl);
      const response = await fetch(
        `${FUNCTIONS['profile-photos']}?userId=${currentUserId}&action=add&photoUrl=${encodedUrl}`,
        {
          headers: { 'X-User-Id': currentUserId || '0' }
        }
      );

      if (response.ok) {
        toast.success('Фото добавлено');
        setPhotoUrl('');
        loadPhotos();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ошибка добавления фото');
      }
    } catch (error) {
      toast.error('Ошибка добавления фото');
    } finally {
      setIsAddingPhoto(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('🟡 1. File selected:', file?.name, file?.type, file?.size);
    
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Выберите изображение');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Максимум 10 МБ');
      return;
    }

    setIsAddingPhoto(true);
    try {
      console.log('🟡 2. Reading file as base64...');
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // FUNCTION: generate-upload-url - Загрузка файла в S3 хранилище
      console.log('🟡 3. Uploading to Timeweb S3...', FUNCTIONS['generate-upload-url']);
      const uploadResponse = await fetch(FUNCTIONS['generate-upload-url'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData: base64, contentType: file.type })
      });

      console.log('🟡 4. Upload response:', uploadResponse.status, uploadResponse.ok);
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload error:', errorText);
        throw new Error('Upload failed');
      }

      const { fileUrl } = await uploadResponse.json();
      console.log('🟡 5. Got fileUrl:', fileUrl);

      // FUNCTION: profile-photos - Сохранение загруженного фото в БД
      console.log('🟡 6. Saving to database via GET (NO HEADERS)...', FUNCTIONS['profile-photos']);
      const addResponse = await fetch(
        `${FUNCTIONS['profile-photos']}?userId=${currentUserId}&action=add&photoUrl=${encodeURIComponent(fileUrl)}&authUserId=${currentUserId}`
      );

      console.log('🟡 7. Save response:', addResponse.status, addResponse.ok);
      if (addResponse.ok) {
        toast.success('Фото загружено');
        loadPhotos();
      } else {
        const errorText = await addResponse.text();
        console.error('Save error:', errorText);
        toast.error('Не удалось сохранить фото');
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('🔴 Upload failed:', error);
      toast.error('Ошибка загрузки');
    } finally {
      setIsAddingPhoto(false);
      e.target.value = '';
    }
  };

  const deletePhoto = async (photoId: number) => {
    try {
      // FUNCTION: profile-photos - Удаление фотографии
      const response = await fetch(
        `https://functions.poehali.dev/6ab5e5ca-f93c-438c-bc46-7eb7a75e2734?photoId=${photoId}`,
        {
          method: 'DELETE',
          headers: {
            'X-User-Id': currentUserId || '0'
          }
        }
      );

      if (response.ok) {
        toast.success('Фото удалено');
        loadPhotos();
      }
    } catch (error) {
      toast.error('Ошибка удаления фото');
    }
  };

  const openChat = () => {
    navigate(`/chat/${userId}`);
  };

  const checkBlockStatus = async () => {
    try {
      // FUNCTION: blacklist - Получение списка заблокированных (проверка статуса)
      const response = await fetch(
        'https://functions.poehali.dev/7d7db6d4-88e3-4f83-8ad5-9fc30ccfd5bf',
        {
          headers: { 'X-User-Id': currentUserId || '0' }
        }
      );
      const data = await response.json();
      const blocked = data.blockedUsers?.some((u: any) => String(u.userId) === String(userId));
      setIsBlocked(blocked);
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const handleBlockToggle = async () => {
    setCheckingBlock(true);
    try {
      if (isBlocked) {
        // FUNCTION: blacklist - Разблокировка пользователя (DELETE)
        const response = await fetch(
          `${FUNCTIONS.blacklist}?targetUserId=${userId}`,
          {
            method: 'DELETE',
            headers: { 'X-User-Id': currentUserId || '0' }
          }
        );
        if (response.ok) {
          setIsBlocked(false);
          toast.success('Пользователь разблокирован');
        }
      } else {
        // FUNCTION: blacklist - Блокировка пользователя (POST)
        const response = await fetch(
          FUNCTIONS.blacklist,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': currentUserId || '0'
            },
            body: JSON.stringify({ user_id: Number(userId) })
          }
        );
        if (response.ok) {
          setIsBlocked(true);
          toast.success('Пользователь заблокирован');
        }
      }
    } catch (error) {
      toast.error('Ошибка при изменении статуса блокировки');
    } finally {
      setCheckingBlock(false);
    }
  };

  const openPhotoViewer = (index: number) => {
    setCurrentPhotoIndex(index);
    setViewerOpen(true);
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!viewerOpen) return;
    if (e.key === 'ArrowRight') nextPhoto();
    if (e.key === 'ArrowLeft') prevPhoto();
    if (e.key === 'Escape') setViewerOpen(false);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerOpen, photos.length]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 10 МБ');
      return;
    }

    setUploadingFile(true);
    console.log('START: uploadingFile = true');
    
    try {
      console.log('1. Reading file...');
      const reader = new FileReader();
      
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log('2. File read, uploading to S3...');
      console.log('   URL:', FUNCTIONS['generate-upload-url']);
      console.log('   Content-Type:', file.type);
      console.log('   Base64 length:', imageBase64.length);
      
      const uploadResponse = await fetch(FUNCTIONS['generate-upload-url'], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          audioData: imageBase64,
          contentType: file.type
        })
      });

      console.log('3. Upload response:', uploadResponse.status, uploadResponse.statusText);
      console.log('   Response headers:', Object.fromEntries(uploadResponse.headers.entries()));
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload error details:', {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          body: errorText
        });
        toast.error(`Ошибка загрузки: ${uploadResponse.status} ${errorText}`);
        throw new Error('Upload failed');
      }

      const { fileUrl } = await uploadResponse.json();
      console.log('4. Got fileUrl:', fileUrl);

      console.log('5. Saving to database...');
      const addPhotoResponse = await fetch(FUNCTIONS['profile-photos'], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId || '0'
        },
        body: JSON.stringify({ photoUrl: fileUrl })
      });

      console.log('6. Save response:', addPhotoResponse.status);
      if (addPhotoResponse.ok) {
        toast.success('Фото добавлено');
        loadPhotos();
      } else {
        const error = await addPhotoResponse.json();
        console.error('Save error:', error);
        toast.error(error.error || 'Ошибка добавления фото');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`Ошибка загрузки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      console.log('FINALLY: setting uploadingFile = false');
      setUploadingFile(false);
      // Сбросить input для возможности повторной загрузки того же файла
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin">
          <Icon name="Loader2" size={32} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Профиль не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-950/20 to-background">
      <div className="container mx-auto px-2 md:px-4 py-3 md:py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-2 md:mb-3 h-8 md:h-9 px-2"
        >
          <Icon name="ArrowLeft" size={18} className="mr-1" />
          <span className="text-sm">Назад</span>
        </Button>

        <Card className="p-3 md:p-6 bg-card/90 backdrop-blur border-purple-500/20">
          <div className="flex items-start gap-3 md:gap-6 mb-3 md:mb-6">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl md:text-3xl font-bold flex-shrink-0">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                profile.username[0]?.toUpperCase()
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-1 md:mb-1.5">
                <h1 className="text-lg md:text-2xl font-bold truncate">{profile.username}</h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs whitespace-nowrap self-start ${
                  profile.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {profile.status === 'online' ? 'Онлайн' : 'Не в сети'}
                </span>
              </div>

              {profile.bio && (
                <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">{profile.bio}</p>
              )}

              {profile.city && (
                <div className="flex items-center gap-1 md:gap-1.5 text-muted-foreground mb-2 md:mb-3">
                  <Icon name="MapPin" size={14} className="text-purple-600" />
                  <span className="text-xs md:text-sm">{profile.city}</span>
                </div>
              )}

              {isOwnProfile && (
                <div className="flex items-center gap-2 mb-2 md:mb-3">
                  <div className="flex items-center gap-1 md:gap-1.5 text-muted-foreground">
                    <Icon name="Zap" size={14} className="text-yellow-500" />
                    <span className="text-xs md:text-sm">{profile.energy} энергии</span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setEnergyModalOpen(true)}
                    className="h-6 px-2 text-xs bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                  >
                    <Icon name="Plus" size={12} className="mr-1" />
                    Пополнить
                  </Button>
                </div>
              )}

              {!isOwnProfile && (
                <div className="flex flex-col md:flex-row gap-2">
                  <Button onClick={openChat} className="bg-gradient-to-r from-purple-500 to-pink-500 h-8 md:h-9 text-xs md:text-sm flex-1">
                    <Icon name="MessageCircle" size={14} className="mr-1.5" />
                    Написать
                  </Button>
                  <Button 
                    onClick={handleBlockToggle}
                    disabled={checkingBlock}
                    variant={isBlocked ? "outline" : "destructive"}
                    className="h-8 md:h-9 text-xs md:text-sm"
                  >
                    {checkingBlock ? (
                      <Icon name="Loader2" size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Icon name={isBlocked ? "UserCheck" : "UserX"} size={14} className="mr-1.5" />
                        {isBlocked ? "Разблокировать" : "Заблокировать"}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-3 md:pt-6">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <h2 className="text-base md:text-xl font-semibold">Фотографии ({photos.length}/6)</h2>
            </div>

            {isOwnProfile && photos.length < 6 && (
              <div className="mb-4">
                <label className="block w-full mb-2">
                  <div 
                    style={{ 
                      backgroundColor: '#001f3f',
                      color: '#ffffff',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isAddingPhoto}
                      className="hidden"
                    />
                    {isAddingPhoto ? (
                      <>
                        <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                        <span>Загрузка фото...</span>
                      </>
                    ) : (
                      <>
                        <Icon name="Upload" size={18} className="mr-2" />
                        <span>🟡 ЖЁЛТАЯ КНОПКА ЗАГРУЗКИ 🟡</span>
                      </>
                    )}
                  </div>
                </label>
              </div>
            )}

            {photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5 md:gap-4">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="relative group aspect-square">
                    <button
                      onClick={() => openPhotoViewer(index)}
                      className="w-full h-full"
                    >
                      <img
                        src={photo.url}
                        alt="User photo"
                        className="w-full h-full object-cover rounded-md md:rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${photo.id}`;
                        }}
                      />
                    </button>
                    {isOwnProfile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePhoto(photo.id);
                        }}
                        className="absolute top-1 right-1 md:top-2 md:right-2 p-1.5 md:p-2 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <Icon name="Trash2" size={16} className="text-white" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {isOwnProfile ? 'Добавьте свои фотографии' : 'Нет фотографий'}
              </p>
            )}
          </div>
        </Card>
      </div>

      {viewerOpen && photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={() => setViewerOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <Icon name="X" size={24} className="text-white" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <Icon name="ChevronLeft" size={32} className="text-white" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <Icon name="ChevronRight" size={32} className="text-white" />
              </button>
            </>
          )}

          <div className="max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            <img
              src={photos[currentPhotoIndex].url}
              alt="Full size photo"
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${photos[currentPhotoIndex].id}`;
              }}
            />
          </div>

          {photos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentPhotoIndex
                      ? 'bg-white w-8'
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Energy Purchase Dialog */}
      <Dialog open={energyModalOpen} onOpenChange={setEnergyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Zap" className="text-yellow-500" />
              Пополнение энергии
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Текущий баланс */}
            <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg">
              <span className="text-sm text-muted-foreground">Текущий баланс:</span>
              <div className="flex items-center gap-1.5">
                <Icon name="Zap" size={16} className="text-yellow-500" />
                <span className="font-bold text-lg">{profile?.energy || 0}</span>
              </div>
            </div>

            {/* Ползунок */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Сумма пополнения</label>
                <Slider
                  value={[energyAmount]}
                  onValueChange={([value]) => setEnergyAmount(value)}
                  min={500}
                  max={10000}
                  step={100}
                  className="py-4"
                />
              </div>

              {/* Информация о покупке */}
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

                {/* Выгода */}
                {discount > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
                    <Icon name="TrendingUp" size={16} className="text-green-500" />
                    <span className="text-sm text-green-600 font-medium">
                      Экономия {discount}% — дополнительно +{energy - energyAmount} энергии!
                    </span>
                  </div>
                )}

                {/* Подсказка о максимальной скидке */}
                {discount < 30 && (
                  <div className="text-xs text-muted-foreground text-center">
                    💡 При покупке на 10 000₽ скидка достигает 30%
                  </div>
                )}
              </div>
            </div>

            {/* Кнопка покупки */}
            <Button 
              onClick={handleEnergyPurchase}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 hover:from-yellow-600 hover:via-orange-600 hover:to-pink-600"
            >
              <Icon name="ShoppingCart" size={20} className="mr-2" />
              Пополнить на {energyAmount}₽
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}