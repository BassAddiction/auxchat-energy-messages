import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  text: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    username: string;
    avatarUrl: string | null;
  };
  voiceUrl?: string | null;
  voiceDuration?: number | null;
}

interface UserProfile {
  id: number;
  username: string;
  avatar: string;
  status: string;
}

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const lastMessageCountRef = useRef(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [checkingBlock, setCheckingBlock] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const currentUserId = localStorage.getItem('auxchat_user_id');

  const updateActivity = async () => {
    try {
      await api.updateActivity(currentUserId!);
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (e) {
      console.log('Audio play failed:', e);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await api.getUser(userId!);
      const photosData = await api.getProfilePhotos(userId!);
      const userAvatar = photosData.photos && photosData.photos.length > 0 
        ? photosData.photos[0].url 
        : data.avatar || '';
      
      setProfile({ ...data, avatar: userAvatar });
    } catch (error) {
      toast.error('Ошибка загрузки профиля');
    }
  };

  const loadCurrentUserProfile = async () => {
    try {
      const data = await api.getUser(currentUserId!);
      const photosData = await api.getProfilePhotos(currentUserId!);
      const userAvatar = photosData.photos && photosData.photos.length > 0 
        ? photosData.photos[0].url 
        : data.avatar || '';
      
      setCurrentUserProfile({ ...data, avatar: userAvatar });
    } catch (error) {
      console.error('Error loading current user profile');
    }
  };

  const loadMessages = async () => {
    try {
      const data = await api.getConversationMessages(userId!, currentUserId!);
      const newMessages = data.messages || [];
      
      if (lastMessageCountRef.current === 0) {
        lastMessageCountRef.current = newMessages.length;
      } else if (newMessages.length > lastMessageCountRef.current) {
        const latestMessage = newMessages[newMessages.length - 1];
        if (String(latestMessage.senderId) !== String(currentUserId)) {
          playNotificationSound();
          toast.info(`Новое сообщение от ${profile?.username || 'пользователя'}`, {
            description: latestMessage.text.slice(0, 50) + (latestMessage.text.length > 50 ? '...' : '')
          });
        }
        lastMessageCountRef.current = newMessages.length;
      }
      
      setMessages(newMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBlockStatus = async () => {
    try {
      const data = await api.checkBlockStatus(currentUserId!, Number(userId));
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
        await api.unblockUser(currentUserId!, Number(userId));
        setIsBlocked(false);
        toast.success('Пользователь разблокирован');
      } else {
        await api.blockUser(currentUserId!, Number(userId));
        setIsBlocked(true);
        toast.success('Пользователь заблокирован');
      }
    } catch (error) {
      toast.error('Ошибка при изменении статуса блокировки');
    } finally {
      setCheckingBlock(false);
    }
  };

  useEffect(() => {
    updateActivity();
    loadProfile();
    loadCurrentUserProfile();
    loadMessages();
    checkBlockStatus();
    const messagesInterval = setInterval(loadMessages, 3000);
    const profileInterval = setInterval(loadProfile, 10000);
    const activityInterval = setInterval(updateActivity, 60000);
    return () => {
      clearInterval(messagesInterval);
      clearInterval(profileInterval);
      clearInterval(activityInterval);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin">
          <Icon name="Loader2" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-purple-950/20 to-background">
      <ChatHeader
        profile={profile}
        userId={userId}
        isBlocked={isBlocked}
        checkingBlock={checkingBlock}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onBack={() => navigate('/')}
        onProfileClick={() => navigate(`/profile/${userId}`)}
        onBlockToggle={handleBlockToggle}
      />
      
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        currentUserProfile={currentUserProfile}
        profile={profile}
      />
      
      <MessageInput
        currentUserId={currentUserId}
        onMessageSent={loadMessages}
      />
    </div>
  );
}
