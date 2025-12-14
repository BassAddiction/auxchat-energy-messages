import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import Icon from "@/components/ui/icon";
import { api } from "@/lib/api";
import { FUNCTIONS } from "@/lib/func2url";
import { Message, User } from "@/types";
import { playNotificationSound, calculatePrice, initializeUserId } from "@/lib/indexHelpers";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<number | null>(() => initializeUserId());
  console.log("[COMPONENT] Rendering with userId:", userId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profilePhotos, setProfilePhotos] = useState<
    { id: number; url: string }[]
  >([]);
  const [displayLimit, setDisplayLimit] = useState(() => {
    return window.innerWidth >= 768 ? 7 : 6;
  });
  const initialLimit = window.innerWidth >= 768 ? 7 : 6;
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef = useRef(0);

  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [subscribedUsers, setSubscribedUsers] = useState<Set<number>>(
    new Set(),
  );
  const subscribedUsersRef = useRef<Set<number>>(new Set());
  const [newSubscribedMessages, setNewSubscribedMessages] = useState(0);
  const lastCheckedMessageIdRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);
  const [geoRadius, setGeoRadius] = useState<number>(() => {
    const stored = localStorage.getItem("geo_radius");
    return stored ? parseInt(stored) : 100;
  });
  const [geoRadiusModalOpen, setGeoRadiusModalOpen] = useState(false);
  const [energyAmount, setEnergyAmount] = useState(500);
  const [energyModalOpen, setEnergyModalOpen] = useState(false);

  const [geoPermissionModalOpen, setGeoPermissionModalOpen] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "sbp" | "sberPay" | "tPay" | null
  >(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lon: number;
    city: string;
  } | null>(null);

  const { energy: calculatedEnergy, discount } = calculatePrice(energyAmount);

  const loadUnreadCount = async () => {
    if (!userId) return;
    try {
      const data = await api.getUnreadCount(userId.toString());
      const total = data.unreadCount || 0;

      if (prevUnreadRef.current === 0) {
        prevUnreadRef.current = total;
      } else if (total > prevUnreadRef.current) {
        playNotificationSound();
        prevUnreadRef.current = total;
      }

      setUnreadCount(total);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const loadMessages = async (retryCount = 0) => {
    try {
      const data = await api.getMessages(20, 0, geoRadius);
      if (data.messages) {
        const formattedMessages: Message[] = data.messages.map((msg: any) => ({
          id: msg.id,
          userId: msg.user.id,
          username: msg.user.username,
          avatar:
            msg.user.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user.username}`,
          text: msg.text,
          timestamp: new Date(msg.created_at),
          reactions: msg.reactions || [],
        }));

        const hasNewMessages =
          formattedMessages.length > prevMessagesLengthRef.current;
        prevMessagesLengthRef.current = formattedMessages.length;

        if (formattedMessages.length > 0) {
          const latestMessageId =
            formattedMessages[formattedMessages.length - 1].id;

          console.log("[SUBSCRIBED CHECK]", {
            latestMessageId,
            lastChecked: lastCheckedMessageIdRef.current,
            subscribedUsersSize: subscribedUsersRef.current.size,
            subscribedUserIds: Array.from(subscribedUsersRef.current),
          });

          if (lastCheckedMessageIdRef.current === 0) {
            lastCheckedMessageIdRef.current = latestMessageId;
            console.log(
              "[SUBSCRIBED CHECK] Initialized lastCheckedMessageId:",
              latestMessageId,
            );
          } else if (latestMessageId > lastCheckedMessageIdRef.current) {
            if (subscribedUsersRef.current.size > 0) {
              const newMessages = formattedMessages.filter(
                (msg) => msg.id > lastCheckedMessageIdRef.current,
              );

              console.log(
                "[SUBSCRIBED CHECK] All new messages:",
                newMessages.map((m) => ({
                  id: m.id,
                  userId: m.userId,
                  username: m.username,
                  isSubscribed: subscribedUsersRef.current.has(m.userId),
                  isNotMe: m.userId !== userId,
                })),
              );

              const newFromSubscribed = newMessages.filter(
                (msg) =>
                  subscribedUsersRef.current.has(msg.userId) &&
                  msg.userId !== userId,
              );

              console.log(
                "[SUBSCRIBED CHECK] New messages:",
                newMessages.length,
                "From subscribed:",
                newFromSubscribed.length,
              );
              console.log(
                "[SUBSCRIBED CHECK] New from subscribed users:",
                newFromSubscribed.map((m) => ({
                  id: m.id,
                  userId: m.userId,
                  username: m.username,
                })),
              );

              if (newFromSubscribed.length > 0) {
                setNewSubscribedMessages((prev) => {
                  console.log(
                    "[SUBSCRIBED CHECK] Updating count:",
                    prev,
                    "->",
                    prev + newFromSubscribed.length,
                  );
                  return prev + newFromSubscribed.length;
                });
              }
            }

            lastCheckedMessageIdRef.current = latestMessageId;
          }
        }

        setMessages(formattedMessages);

        if (hasNewMessages) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      }
    } catch (error) {
      console.error("Load messages error:", error);
      if (retryCount < 2) {
        setTimeout(() => loadMessages(retryCount + 1), 1000);
      }
    }
  };

  const loadUser = async (id: number) => {
    console.log("[LOAD USER] Starting loadUser for id:", id);
    try {
      const data = await api.getUser(id.toString());
      console.log("[LOAD USER] Got data:", data);

      if (data.username) {
        const photosData = await api.getProfilePhotos(id.toString());
        console.log("[LOAD USER] Photos data:", photosData);
        const userAvatar =
          photosData.photos && photosData.photos.length > 0
            ? photosData.photos[0].url
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`;

        console.log("[LOAD USER] Setting avatar to:", userAvatar);
        setUser({
          username: data.username,
          avatar: userAvatar,
          phone: data.phone,
          energy: data.energy,
          status: data.status || '',
        });
        console.log(
          "[LOAD USER] User set successfully with avatar:",
          userAvatar,
        );

        console.log("[GEO] User data:", {
          latitude: data.latitude,
          longitude: data.longitude,
        });
        if (data.latitude && data.longitude) {
          console.log("[GEO] User has location, setting userLocation");
          setUserLocation({
            lat: data.latitude,
            lon: data.longitude,
            city: data.city || "",
          });
        } else {
          console.log("[GEO] User has no location, showing permission modal");
          setTimeout(() => {
            setGeoPermissionModalOpen(true);
          }, 500);
        }
      } else {
        console.error(
          "[LOAD USER] No username in response, NOT clearing userId",
        );
      }
    } catch (error) {
      console.error("[LOAD USER] Error loading user:", error);
    }
  };

  const loadSubscribedUsers = async () => {
    if (!userId) return;
    try {
      const data = await api.getSubscriptions(userId.toString());
      const userIds = data.subscribedUserIds || [];
      console.log("[SUBSCRIPTIONS] Loaded subscribed users:", userIds);
      const userIdsSet = new Set(userIds);
      subscribedUsersRef.current = userIdsSet;
      setSubscribedUsers(userIdsSet);
    } catch (error) {
      console.error("Load subscribed users error:", error);
    }
  };

  const updateActivity = async () => {
    if (!userId) return;
    try {
      await api.updateActivity(userId.toString());
    } catch (error) {
      console.error("Error updating activity:", error);
    }
  };

  const loadProfilePhotos = async () => {
    if (!userId) return;
    try {
      const data = await api.getProfilePhotos(userId.toString());
      setProfilePhotos(data.photos || []);
    } catch (error) {
      console.error("Load photos error:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (userId) {
        await loadSubscribedUsers();
        updateActivity();
        loadProfilePhotos();
        loadUnreadCount();
      }
      loadMessages();
    };

    init();

    const messagesInterval = setInterval(() => {
      loadMessages();
      if (userId) {
        loadUnreadCount();
      }
    }, 5000);
    const activityInterval = setInterval(() => {
      if (userId) updateActivity();
    }, 60000);
    return () => {
      clearInterval(messagesInterval);
      clearInterval(activityInterval);
    };
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadUser(userId);
      loadUnreadCount();
    }
  }, [userId]);

  const handleAuthSuccess = (userData: User & { id: number; token?: string }) => {
    setUser({
      username: userData.username,
      avatar: userData.avatar,
      phone: userData.phone,
      energy: userData.energy,
      status: userData.status || "",
    });
    setUserId(userData.id);
    localStorage.setItem("auxchat_user_id", userData.id.toString());
    if (userData.token) {
      localStorage.setItem("auxchat_token", userData.token);
      console.log("[AUTH] JWT token saved successfully");
    }
    setIsAuthOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    setUserId(null);
    localStorage.removeItem("auxchat_user_id");
    localStorage.removeItem("auxchat_token");
  };

  const handleUpdateGeoRadius = () => {
    localStorage.setItem("geo_radius", geoRadius.toString());
    setGeoRadiusModalOpen(false);
    loadMessages();
  };

  const handleEnableLocation = async () => {
    if (!userId) return;
    setUpdatingLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        },
      );

      const { latitude, longitude } = position.coords;

      const response = await fetch(FUNCTIONS["update-location"], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId.toString(),
        },
        body: JSON.stringify({
          latitude,
          longitude,
        }),
      });

      if (response.ok) {
        const geoResponse = await fetch(
          `${FUNCTIONS["geocode"]}?lat=${latitude}&lon=${longitude}`,
        );
        const geoData = await geoResponse.json();

        setUserLocation({
          lat: latitude,
          lon: longitude,
          city: geoData.city || "",
        });

        setGeoPermissionModalOpen(false);
        alert("Геолокация успешно включена!");
      } else {
        alert("Не удалось обновить геолокацию");
      }
    } catch (error) {
      console.error("Location error:", error);
      alert(
        "Не удалось получить доступ к геолокации. Проверьте настройки браузера.",
      );
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userId || !user) {
      setIsAuthOpen(true);
      return;
    }

    if (user.energy < 1) {
      alert("Недостаточно энергии! Пополните баланс.");
      return;
    }

    if (messageText.trim()) {
      try {
        const data = await api.sendMessage(
          userId.toString(),
          0,
          messageText.trim(),
        );

        if (data.error) {
          if (data.error.includes("banned")) {
            alert("Вы заблокированы и не можете отправлять сообщения");
            handleLogout();
          } else {
            alert(data.error);
          }
          return;
        }

        if (data) {
          try {
            const audioContext = new (window.AudioContext ||
              (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
              400,
              audioContext.currentTime + 0.08,
            );

            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
              0.01,
              audioContext.currentTime + 0.08,
            );

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.08);
          } catch (e) {
            console.log("Audio play failed:", e);
          }
          setMessageText("");
          loadMessages();
          if (data.energy !== undefined) {
            setUser({ ...user, energy: data.energy });
          }
        }
      } catch (error) {
        console.error("Send message error:", error);
        alert("Ошибка подключения");
      }
    }
  };

  const checkSubscription = async (targetUserId: number) => {
    if (!userId) return;
    setCheckingSubscription(true);
    try {
      const response = await fetch(
        `${FUNCTIONS["subscribe"]}?targetUserId=${targetUserId}`,
        {
          headers: { "X-User-Id": userId.toString() },
        },
      );
      const data = await response.json();
      setIsSubscribed(data.isSubscribed || false);
    } catch (error) {
      console.error("Check subscription error:", error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleSubscribe = async () => {
    if (!userId || !selectedUserId) return;

    try {
      const response = await fetch(FUNCTIONS["subscribe"], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId.toString(),
        },
        body: JSON.stringify({ targetUserId: selectedUserId }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        loadSubscribedUsers();
        alert(`Вы подписались на ${selectedUsername}!`);
        setSubscriptionModalOpen(false);
      }
    } catch (error) {
      console.error("Subscribe error:", error);
      alert("Ошибка подписки");
    }
  };

  const handleUnsubscribe = async () => {
    if (!userId || !selectedUserId) return;

    try {
      const response = await fetch(
        `${FUNCTIONS["subscribe"]}?targetUserId=${selectedUserId}`,
        {
          method: "DELETE",
          headers: { "X-User-Id": userId.toString() },
        },
      );

      if (response.ok) {
        setIsSubscribed(false);
        loadSubscribedUsers();
        alert(`Вы отписались от ${selectedUsername}`);
        setSubscriptionModalOpen(false);
      }
    } catch (error) {
      console.error("Unsubscribe error:", error);
      alert("Ошибка отписки");
    }
  };

  const openSubscriptionModal = (targetUserId: number, username: string) => {
    if (!userId) {
      setIsAuthOpen(true);
      return;
    }
    if (targetUserId === userId) {
      alert("Нельзя подписаться на самого себя");
      return;
    }
    setSelectedUserId(targetUserId);
    setSelectedUsername(username);
    setSubscriptionModalOpen(true);
    checkSubscription(targetUserId);
  };

  const handleAddEnergy = async (amount: number) => {
    if (!userId || !user) {
      console.log("No user or userId");
      return;
    }

    setPaymentMethodModalOpen(true);
  };

  const handlePaymentMethodSelect = async (
    method: "sbp" | "sberPay" | "tPay",
  ) => {
    setSelectedPaymentMethod(method);
    setPaymentMethodModalOpen(false);

    if (!userId || !user) return;

    console.log(
      "Creating payment for amount:",
      energyAmount,
      "method:",
      method,
    );

    try {
      const response = await fetch(FUNCTIONS["create-payment"], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          amount: energyAmount,
          payment_method: method,
        }),
      });

      console.log("Payment response:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Payment data:", data);
        if (data.payment_url) {
          window.location.href = data.payment_url;
        }
      } else {
        const error = await response.json();
        console.error("Payment failed:", error);

        let errorMessage = error.error || "Неизвестная ошибка";
        if (error.details) {
          errorMessage += "\n\nДетали от YooKassa:\n" + error.details;
        }

        alert("Ошибка создания платежа: " + errorMessage);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Ошибка соединения с сервером оплаты");
    }
  };

  const handleAddReaction = async (messageId: number, emoji: string) => {
    if (!userId) {
      setIsAuthOpen(true);
      return;
    }

    try {
      await fetch(FUNCTIONS["add-reaction"], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": userId.toString(),
        },
        body: JSON.stringify({ message_id: messageId, emoji }),
      });

      loadMessages();
    } catch (error) {
      console.error("Add reaction error:", error);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-2 md:px-3 py-2 flex justify-between items-center flex-shrink-0 z-10">
        <div className="flex items-center gap-1.5 md:gap-2">
          <Icon name="MessageCircle" className="text-red-500" size={20} />
          <h1 className="text-lg md:text-xl font-bold text-red-500">AuxChat</h1>
        </div>
        <div className="flex items-center gap-0.5 md:gap-1">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/messages")}
                className="relative h-8 w-8 p-0"
              >
                <Icon name="MessageCircle" size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
              {newSubscribedMessages > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNewSubscribedMessages(0);
                    loadMessages();
                  }}
                  className="relative h-8 px-2 bg-blue-50 hover:bg-blue-100"
                >
                  <Icon name="Bell" size={16} className="text-blue-600" />
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {newSubscribedMessages > 9 ? "9+" : newSubscribedMessages}
                  </span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGeoRadiusModalOpen(true)}
                className="h-8 px-2"
              >
                <Icon name="MapPin" size={16} className="md:mr-1" />
                <span className="hidden md:inline text-xs">
                  {geoRadius === 99999 ? "∞" : `${geoRadius}км`}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfile(true)}
                className="h-8 w-8 p-0"
              >
                <Avatar className="w-6 h-6">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>{user?.username?.[0]}</AvatarFallback>
                </Avatar>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-8 w-8 p-0"
              >
                <Icon name="LogOut" size={16} />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAuthOpen(true)}
              className="h-8"
            >
              <Icon name="LogIn" size={16} className="md:mr-1" />
              <span className="hidden md:inline">Войти</span>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-2 md:px-3 py-2 space-y-3">
        {messages.slice(-displayLimit).map((msg) => (
          <div key={msg.id} className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex items-start gap-2">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={msg.avatar} />
                <AvatarFallback>{msg.username[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openSubscriptionModal(msg.userId, msg.username)}
                    className="font-semibold text-sm hover:text-blue-600 transition-colors"
                  >
                    {msg.username}
                  </button>
                  <span className="text-xs text-gray-500">
                    {msg.timestamp.toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 break-words whitespace-pre-wrap mt-1">
                  {msg.text}
                </p>
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {msg.reactions.map((reaction, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAddReaction(msg.id, reaction.emoji)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-0.5"
                      >
                        {reaction.emoji} {reaction.count}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-1 mt-2">
                  {['👍', '❤️', '😂', '🔥'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleAddReaction(msg.id, emoji)}
                      className="text-lg hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        {messages.length > displayLimit && (
          <Button
            variant="outline"
            onClick={() => setDisplayLimit((prev) => prev + 5)}
            className="w-full"
          >
            Показать больше
          </Button>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 p-2 md:p-3 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              !user
                ? 'Войдите, чтобы отправить сообщение'
                : user.energy < 1
                ? 'Пополните энергию для отправки сообщений'
                : 'Напишите сообщение...'
            }
            disabled={!user || user.energy < 1}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={2}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!user || user.energy < 1 || !messageText.trim()}
            className="self-end"
            size="sm"
          >
            <Icon name="Send" size={18} />
          </Button>
        </div>
      </footer>

      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вход / Регистрация</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Авторизуйтесь для отправки сообщений</p>
            <Button onClick={() => { /* auth logic */ }} className="w-full">
              Войти через телефон
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {user && (
        <Dialog open={showProfile} onOpenChange={setShowProfile}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Профиль</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.username[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{user.username}</p>
                  <p className="text-sm text-gray-600">{user.phone}</p>
                  <p className="text-sm">⚡ {user.energy} энергии</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setShowProfile(false);
                  setEnergyModalOpen(true);
                }}
                className="w-full"
              >
                Пополнить энергию
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog
        open={subscriptionModalOpen}
        onOpenChange={setSubscriptionModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отслеживание пользователя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Хотите отслеживать сообщения от <strong>{selectedUsername}</strong>?
            </p>
            {checkingSubscription ? (
              <p className="text-sm text-gray-600">Проверка...</p>
            ) : isSubscribed ? (
              <>
                <p className="text-sm text-green-600">
                  Вы уже отслеживаете этого пользователя
                </p>
                <Button onClick={handleUnsubscribe} variant="outline" className="w-full">
                  Отписаться
                </Button>
              </>
            ) : (
              <Button onClick={handleSubscribe} className="w-full">
                Подписаться
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={geoRadiusModalOpen} onOpenChange={setGeoRadiusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="MapPin" size={20} />
              Радиус видимости сообщений
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>
                Текущий радиус:{" "}
                <strong>
                  {geoRadius === 99999 ? "Без ограничений" : `${geoRadius} км`}
                </strong>
              </Label>
              <Slider
                value={[geoRadius === 99999 ? 1000 : geoRadius]}
                onValueChange={([value]) =>
                  setGeoRadius(value >= 1000 ? 99999 : value)
                }
                min={1}
                max={1000}
                step={10}
                className="mt-2"
              />
              <p className="text-xs text-gray-600 mt-2">
                {geoRadius === 99999
                  ? "Вы видите сообщения со всего мира"
                  : `Вы видите сообщения в радиусе ${geoRadius} км от вашего местоположения`}
              </p>
            </div>
            <Button onClick={handleUpdateGeoRadius} className="w-full">
              Применить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={geoPermissionModalOpen}
        onOpenChange={setGeoPermissionModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="MapPin" size={20} />
              Включить геолокацию?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              Геолокация позволяет видеть сообщения от пользователей рядом с вами
              и определять ваш город.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleEnableLocation}
                disabled={updatingLocation}
                className="flex-1"
              >
                {updatingLocation ? "Определение..." : "Включить"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setGeoPermissionModalOpen(false)}
                disabled={updatingLocation}
                className="flex-1"
              >
                Позже
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={paymentMethodModalOpen}
        onOpenChange={setPaymentMethodModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выберите способ оплаты</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Сумма: <strong>{energyAmount} ₽</strong>
            </p>
            <p className="text-sm text-gray-600">
              Получите: <strong>{calculatedEnergy} энергии</strong>
              {discount > 0 && (
                <span className="text-green-600 ml-2">+{discount}% бонус!</span>
              )}
            </p>
            <Button
              onClick={() => handlePaymentMethodSelect("sbp")}
              className="w-full"
              variant="outline"
            >
              <Icon name="Smartphone" size={18} className="mr-2" />
              СБП (Система Быстрых Платежей)
            </Button>
            <Button
              onClick={() => handlePaymentMethodSelect("sberPay")}
              className="w-full"
              variant="outline"
            >
              <Icon name="CreditCard" size={18} className="mr-2" />
              SberPay
            </Button>
            <Button
              onClick={() => handlePaymentMethodSelect("tPay")}
              className="w-full"
              variant="outline"
            >
              <Icon name="Wallet" size={18} className="mr-2" />
              T-Pay
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {user && (
        <Dialog open={energyModalOpen} onOpenChange={setEnergyModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon name="Zap" size={20} />
                Пополнить энергию
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Выберите сумму (₽)</Label>
                <Slider
                  value={[energyAmount]}
                  onValueChange={([value]) => setEnergyAmount(value)}
                  min={100}
                  max={5000}
                  step={100}
                  className="mt-2"
                />
                <div className="flex justify-between text-sm mt-2">
                  <span>{energyAmount} ₽</span>
                  <span className="text-green-600 font-bold">
                    {calculatedEnergy} энергии
                    {discount > 0 && (
                      <span className="text-xs ml-1">(+{discount}%)</span>
                    )}
                  </span>
                </div>
              </div>
              <Button
                onClick={() => handleAddEnergy(energyAmount)}
                className="w-full"
              >
                Пополнить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Index;