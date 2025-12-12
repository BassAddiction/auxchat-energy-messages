import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export const useProfileData = (userId: string | undefined, currentUserId: string | null) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!currentUserId) {
      navigate('/');
      return;
    }
    updateActivity();
    loadProfile();
    loadPhotos();
    const activityInterval = setInterval(updateActivity, 60000);
    return () => clearInterval(activityInterval);
  }, [userId]);

  return {
    profile,
    photos,
    loading,
    loadProfile,
    loadPhotos,
    setProfile
  };
};
