import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { FUNCTIONS } from '@/lib/func2url';
import ProfileHeader from '@/components/profile/ProfileHeader';
import PhotoGallery from '@/components/profile/PhotoGallery';
import PhotoViewer from '@/components/profile/PhotoViewer';
import EnergyPurchaseDialog from '@/components/profile/EnergyPurchaseDialog';

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

  const calculatePrice = (rubles: number) => {
    const discountPercent = ((rubles - 500) / (10000 - 500)) * 30;
    const baseEnergy = rubles;
    const bonus = Math.floor(baseEnergy * (discountPercent / 100));
    return { energy: baseEnergy + bonus, discount: Math.round(discountPercent) };
  };

  const { energy, discount } = calculatePrice(energyAmount);

  const updateActivity = async () => {
    try {
      await fetch(FUNCTIONS['update-activity'], {
        method: 'POST',
        headers: { 'X-User-Id': currentUserId || '0' }
      });
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const handleEnergyPurchase = async () => {
    try {
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
      const response = await fetch(
        `${FUNCTIONS['get-user']}?user_id=${userId}`
      );
      const data = await response.json();
      
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

      console.log('🟡 3. Uploading to Timeweb S3...', FUNCTIONS['generate-upload-url']);
      const uploadResponse = await fetch(FUNCTIONS['generate-upload-url'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId || '0' },
        body: JSON.stringify({ fileData: base64, fileName: file.name, contentType: file.type })
      });

      console.log('🟡 4. Upload response:', uploadResponse.status, uploadResponse.ok);
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload error:', errorText);
        throw new Error('Upload failed');
      }

      const { fileUrl } = await uploadResponse.json();
      console.log('🟡 5. Got fileUrl:', fileUrl);

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
      const response = await fetch(
        `${FUNCTIONS['profile-photos']}?photoId=${photoId}`,
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
      const response = await fetch(
        FUNCTIONS['blacklist'],
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
          <ProfileHeader
            profile={profile}
            isOwnProfile={isOwnProfile}
            isBlocked={isBlocked}
            checkingBlock={checkingBlock}
            onOpenChat={openChat}
            onBlockToggle={handleBlockToggle}
            onOpenEnergyModal={() => setEnergyModalOpen(true)}
          />

          <PhotoGallery
            photos={photos}
            isOwnProfile={isOwnProfile}
            isAddingPhoto={isAddingPhoto}
            onPhotoUpload={handlePhotoUpload}
            onPhotoClick={openPhotoViewer}
            onDeletePhoto={deletePhoto}
          />
        </Card>
      </div>

      <PhotoViewer
        photos={photos}
        currentIndex={currentPhotoIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onNext={nextPhoto}
        onPrev={prevPhoto}
        onSetIndex={setCurrentPhotoIndex}
      />

      <EnergyPurchaseDialog
        isOpen={energyModalOpen}
        onClose={() => setEnergyModalOpen(false)}
        profile={profile}
        energyAmount={energyAmount}
        onEnergyAmountChange={setEnergyAmount}
        onPurchase={handleEnergyPurchase}
      />
    </div>
  );
}
