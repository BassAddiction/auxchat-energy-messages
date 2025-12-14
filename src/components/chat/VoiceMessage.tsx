import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface VoiceMessageProps {
  voiceUrl: string;
  duration: number;
  isOwn: boolean;
}

export default function VoiceMessage({ voiceUrl, duration, isOwn }: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Генерируем случайные высоты для волн (фиксированные для каждого сообщения)
  const waveHeights = useRef(
    Array.from({ length: 40 }, () => Math.random() * 20 + 8)
  ).current;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 min-w-[240px] max-w-[320px]">
      <audio ref={audioRef} src={voiceUrl} preload="metadata" />
      
      {/* Круглая кнопка Play/Pause */}
      <button
        onClick={togglePlay}
        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-lg ${
          isOwn 
            ? 'bg-gradient-to-br from-red-500 via-red-600 to-black hover:from-red-600 hover:via-red-700 hover:to-black' 
            : 'bg-gradient-to-br from-red-400 via-rose-500 to-gray-900 hover:from-red-500 hover:via-rose-600 hover:to-black'
        } text-white`}
      >
        {isPlaying ? (
          <Icon name="Pause" size={20} className="fill-current" />
        ) : (
          <Icon name="Play" size={20} className="ml-0.5 fill-current" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        {/* Визуализация волн */}
        <div className="flex items-center gap-[2px] h-8">
          {waveHeights.map((height, index) => {
            const barProgress = (index / waveHeights.length) * 100;
            const isActive = barProgress <= progress;
            
            return (
              <div
                key={index}
                className={`w-[3px] rounded-full transition-all duration-100 ${
                  isOwn
                    ? isActive 
                      ? 'bg-white' 
                      : 'bg-white/40'
                    : isActive 
                      ? 'bg-blue-500' 
                      : 'bg-gray-300'
                }`}
                style={{ 
                  height: `${height}px`,
                  opacity: isActive ? 1 : 0.5
                }}
              />
            );
          })}
        </div>
        
        {/* Время воспроизведения */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium tabular-nums ${
            isOwn ? 'text-white/90' : 'text-gray-600'
          }`}>
            {formatTime(isPlaying ? currentTime : duration)}
          </span>
          {isPlaying && (
            <div className={`w-1.5 h-1.5 rounded-full ${
              isOwn ? 'bg-white' : 'bg-green-500'
            }`} />
          )}
        </div>
      </div>
    </div>
  );
}