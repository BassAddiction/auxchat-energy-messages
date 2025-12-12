import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { FUNCTIONS } from '@/lib/func2url';

export const useBlockManagement = (
  userId: string | undefined,
  currentUserId: string | null,
  isOwnProfile: boolean
) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [checkingBlock, setCheckingBlock] = useState(false);

  const checkBlockStatus = async () => {
    try {
      const response = await fetch(
        FUNCTIONS['blacklist'],
        {
          headers: { 'X-User-Id': currentUserId || '0' }
        }
      );
      const data = await response.json();
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
        const response = await fetch(
          `${FUNCTIONS.blacklist}?targetUserId=${userId}`,
          {
            method: 'DELETE',
            headers: { 'X-User-Id': currentUserId || '0' }
          }
        );
        if (response.ok) {
          setIsBlocked(false);
          toast.success('Пользователь разблокирован');
        }
      } else {
        const response = await fetch(
          FUNCTIONS.blacklist,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-User-Id': currentUserId || '0'
            },
            body: JSON.stringify({ user_id: Number(userId) })
          }
        );
        if (response.ok) {
          setIsBlocked(true);
          toast.success('Пользователь заблокирован');
        }
      }
    } catch (error) {
      toast.error('Ошибка при изменении статуса блокировки');
    } finally {
      setCheckingBlock(false);
    }
  };

  useEffect(() => {
    if (!isOwnProfile) {
      checkBlockStatus();
    }
  }, [userId, isOwnProfile]);

  return {
    isBlocked,
    checkingBlock,
    handleBlockToggle
  };
};
