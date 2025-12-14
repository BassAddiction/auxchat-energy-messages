import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface UserProfile {
  id: number;
  username: string;
  avatar: string;
  status: string;
  last_seen?: string | null;
}

interface ChatHeaderProps {
  profile: UserProfile | null;
  userId: string | undefined;
  isBlocked: boolean;
  checkingBlock: boolean;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  onBack: () => void;
  onProfileClick: () => void;
  onBlockToggle: () => void;
  isTyping?: boolean;
}

export default function ChatHeader({
  profile,
  userId,
  isBlocked,
  checkingBlock,
  menuOpen,
  setMenuOpen,
  onBack,
  onProfileClick,
  onBlockToggle,
  isTyping = false,
}: ChatHeaderProps) {
  return (
    <div className="bg-card/80 backdrop-blur border-b border-purple-500/20 p-3 md:p-4 flex items-center gap-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="h-8 w-8 p-0"
      >
        <Icon name="ArrowLeft" size={20} />
      </Button>
      
      <button
        onClick={onProfileClick}
        className="flex items-center gap-3 flex-1"
      >
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
          {profile?.avatar ? (
            <img 
              src={profile.avatar} 
              alt={profile.username} 
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.textContent = profile.username[0]?.toUpperCase() || '?';
              }}
            />
          ) : (
            profile?.username[0]?.toUpperCase()
          )}
        </div>
        <div className="text-left">
          <h2 className="font-bold text-sm md:text-base">{profile?.username}</h2>
          {isTyping ? (
            <span className="text-xs text-blue-500 flex items-center gap-1">
              печатает
              <span className="flex gap-0.5">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            </span>
          ) : (
            <span className={`text-xs ${profile?.status === 'online' ? 'text-green-400' : 'text-muted-foreground'}`}>
              {profile?.status === 'online' ? 'В сети' : (
                profile?.last_seen ? (
                  `был(а) в ${new Date(profile.last_seen).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
                ) : 'Не в сети'
              )}
            </span>
          )}
        </div>
      </button>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Icon name="MoreVertical" size={20} />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Действия</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              onClick={() => {
                onProfileClick();
                setMenuOpen(false);
              }}
              variant="outline"
              className="w-full justify-start"
            >
              <Icon name="User" size={16} className="mr-2" />
              Профиль
            </Button>
            <Button
              onClick={() => {
                onBlockToggle();
                setMenuOpen(false);
              }}
              disabled={checkingBlock}
              variant={isBlocked ? "outline" : "destructive"}
              className="w-full justify-start"
            >
              {checkingBlock ? (
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
              ) : (
                <Icon name={isBlocked ? "UserCheck" : "UserX"} size={16} className="mr-2" />
              )}
              {isBlocked ? 'Разблокировать' : 'Заблокировать'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}