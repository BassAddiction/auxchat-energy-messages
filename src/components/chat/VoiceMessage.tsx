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

  // Генерируем случайные высоты для волны (имитация)
  const waveHeights = Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2);
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <audio ref={audioRef} src={voiceUrl} preload="metadata" />
      
      <button
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          isOwn 
            ? 'bg-white text-purple-500 hover:bg-purple-50' 
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        {isPlaying ? (
          <Icon name="Pause" size={18} />
        ) : (
          <Icon name="Play" size={18} className="ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-0.5 h-8">
          {waveHeights.map((height, i) => {
            const barProgress = i / waveHeights.length;
            const isActive = barProgress <= progress;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all ${
                  isActive
                    ? isOwn ? 'bg-white' : 'bg-blue-400'
                    : isOwn ? 'bg-purple-300/50' : 'bg-gray-400/50'
                }`}
                style={{ height: `${height * 100}%`, minWidth: '2px' }}
              />
            );
          })}
        </div>
        
        <div className={`flex items-center gap-1.5 text-xs font-mono ${isOwn ? 'text-purple-100' : 'text-muted-foreground'}`}>
          <span>{formatTime(isPlaying ? currentTime : 0)}</span>
          <span className="opacity-50">•</span>
          <span className="opacity-70">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}