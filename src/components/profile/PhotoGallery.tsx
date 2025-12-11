import Icon from '@/components/ui/icon';

interface Photo {
  id: number;
  url: string;
  created_at: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  isOwnProfile: boolean;
  isAddingPhoto: boolean;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoClick: (index: number) => void;
  onDeletePhoto: (photoId: number) => void;
}

export default function PhotoGallery({
  photos,
  isOwnProfile,
  isAddingPhoto,
  onPhotoUpload,
  onPhotoClick,
  onDeletePhoto
}: PhotoGalleryProps) {
  return (
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
                onChange={onPhotoUpload}
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
                onClick={() => onPhotoClick(index)}
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
                    onDeletePhoto(photo.id);
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
  );
}
