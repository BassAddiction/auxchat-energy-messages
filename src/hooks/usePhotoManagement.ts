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
      console.log('[PHOTO] Reading file...');
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log('[PHOTO] Uploading to S3...');
      const uploadResponse = await fetch(FUNCTIONS['upload-photo'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData: base64, contentType: file.type })
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[PHOTO] Upload failed:', uploadResponse.status, errorText);
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const { fileUrl } = await uploadResponse.json();
      console.log('[PHOTO] Uploaded:', fileUrl);

      console.log('[PHOTO] Saving to database...');
      const addResponse = await fetch(
        `${FUNCTIONS['profile-photos']}?userId=${currentUserId}&action=add&photoUrl=${encodeURIComponent(fileUrl)}&authUserId=${currentUserId}`
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
      console.log('   ALL FUNCTIONS:', FUNCTIONS);
      console.log('   URL:', FUNCTIONS['upload-photo']);
      console.log('   Content-Type:', file.type);
      console.log('   Base64 length:', imageBase64.length);
      
      const uploadResponse = await fetch(FUNCTIONS['upload-photo'], {
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