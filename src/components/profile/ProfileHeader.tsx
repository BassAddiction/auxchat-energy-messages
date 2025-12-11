import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

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

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  isBlocked: boolean;
  checkingBlock: boolean;
  onOpenChat: () => void;
  onBlockToggle: () => void;
  onOpenEnergyModal: () => void;
}

export default function ProfileHeader({
  profile,
  isOwnProfile,
  isBlocked,
  checkingBlock,
  onOpenChat,
  onBlockToggle,
  onOpenEnergyModal
}: ProfileHeaderProps) {
  return (
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
              onClick={onOpenEnergyModal}
              className="h-6 px-2 text-xs bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Icon name="Plus" size={12} className="mr-1" />
              Пополнить
            </Button>
          </div>
        )}

        {!isOwnProfile && (
          <div className="flex flex-col md:flex-row gap-2">
            <Button onClick={onOpenChat} className="bg-gradient-to-r from-purple-500 to-pink-500 h-8 md:h-9 text-xs md:text-sm flex-1">
              <Icon name="MessageCircle" size={14} className="mr-1.5" />
              Написать
            </Button>
            <Button 
              onClick={onBlockToggle}
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
  );
}
