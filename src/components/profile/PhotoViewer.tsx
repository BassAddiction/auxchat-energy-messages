import { useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface Photo {
  id: number;
  url: string;
  created_at: string;
}

interface PhotoViewerProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSetIndex: (index: number) => void;
}

export default function PhotoViewer({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrev,
  onSetIndex
}: PhotoViewerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNext, onPrev, onClose]);

  if (!isOpen || photos.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <Icon name="X" size={24} className="text-white" />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={onPrev}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <Icon name="ChevronLeft" size={32} className="text-white" />
          </button>
          <button
            onClick={onNext}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <Icon name="ChevronRight" size={32} className="text-white" />
          </button>
        </>
      )}

      <div className="max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
        <img
          src={photos[currentIndex].url}
          alt="Full size photo"
          className="max-w-full max-h-full object-contain rounded-lg"
          onError={(e) => {
            e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${photos[currentIndex].id}`;
          }}
        />
      </div>

      {photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => onSetIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
