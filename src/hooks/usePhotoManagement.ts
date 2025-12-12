import { useState } from 'react';
import { toast } from 'sonner';
import { FUNCTIONS } from '@/lib/func2url';

export const usePhotoManagement = (
  currentUserId: string | null,
  loadPhotos: () => Promise<void>
) => {
  const [photoUrl, setPhotoUrl] = useState('');
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

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
      console.log('[PHOTO] Getting presigned URL...');
      const presignedResponse = await fetch(
        `${FUNCTIONS['generate-presigned-url']}?contentType=${encodeURIComponent(file.type)}`
      );

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, publicUrl } = await presignedResponse.json();
      console.log('[PHOTO] Uploading directly to S3...');

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      console.log('[PHOTO] Uploaded:', publicUrl);
      console.log('[PHOTO] Saving to database...');
      
      const addResponse = await fetch(
        `${FUNCTIONS['profile-photos']}?userId=${currentUserId}&action=add&photoUrl=${encodeURIComponent(publicUrl)}&authUserId=${currentUserId}`
      );

      if (addResponse.ok) {
        toast.success('Фото загружено');
        loadPhotos();
      } else {
        const errorText = await addResponse.text();
        console.error('[PHOTO] Save failed:', addResponse.status, errorText);
        toast.error('Не удалось сохранить фото');
      }
    } catch (error) {
      console.error('[PHOTO] Error:', error);
      toast.error(`Ошибка загрузки: ${error instanceof Error ? error.message : 'Unknown'}`);
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
    console.log('[PHOTO UPLOAD] Getting presigned URL...');
    
    try {
      const presignedResponse = await fetch(
        `${FUNCTIONS['generate-presigned-url']}?contentType=${encodeURIComponent(file.type)}`
      );

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, publicUrl } = await presignedResponse.json();
      console.log('[PHOTO UPLOAD] Uploading directly to S3...');

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      console.log('[PHOTO UPLOAD] Uploaded:', publicUrl);
      console.log('[PHOTO UPLOAD] Saving to database...');
      
      const addPhotoResponse = await fetch(FUNCTIONS['profile-photos'], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': currentUserId || '0'
        },
        body: JSON.stringify({ photoUrl: publicUrl })
      });

      if (addPhotoResponse.ok) {
        toast.success('Фото добавлено');
        loadPhotos();
      } else {
        const error = await addPhotoResponse.json();
        console.error('[PHOTO UPLOAD] Save error:', error);
        toast.error(error.error || 'Ошибка добавления фото');
      }
    } catch (error) {
      console.error('[PHOTO UPLOAD] Failed:', error);
      toast.error(`Ошибка загрузки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  return {
    photoUrl,
    setPhotoUrl,
    isAddingPhoto,
    uploadingFile,
    setUploadingFile,
    addPhotoByUrl,
    handlePhotoUpload,
    deletePhoto,
    handleFileUpload
  };
};