import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface Message {
  id: number;
  username: string;
  avatar: string;
  text: string;
  timestamp: Date;
  reactions: { emoji: string; count: number }[];
}

interface User {
  username: string;
  avatar: string;
  energy: number;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      username: 'Космонавт',
      avatar: '🚀',
      text: 'Привет, AuxChat! Первое сообщение в чате!',
      timestamp: new Date(Date.now() - 3600000),
      reactions: [{ emoji: '❤️', count: 5 }, { emoji: '🔥', count: 3 }]
    },
    {
      id: 2,
      username: 'Энергетик',
      avatar: '⚡',
      text: 'Система энергии работает отлично!',
      timestamp: new Date(Date.now() - 1800000),
      reactions: [{ emoji: '👍', count: 8 }]
    },
    {
      id: 3,
      username: 'Разработчик',
      avatar: '💻',
      text: 'Реакции на сообщения - это круто!',
      timestamp: new Date(Date.now() - 900000),
      reactions: [{ emoji: '🎉', count: 12 }]
    }
  ]);
  const [messageText, setMessageText] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👤');

  const avatars = ['👤', '🚀', '⚡', '💻', '🎨', '🎭', '🎪', '🎯', '🎲', '🎮', '🎸', '🎹'];
  const reactionEmojis = ['❤️', '👍', '🔥', '🎉', '😂', '😍'];

  const handleRegister = () => {
    if (username.trim()) {
      setUser({
        username: username.trim(),
        avatar: selectedAvatar,
        energy: 100
      });
      setIsRegistering(false);
    }
  };

  const handleSendMessage = () => {
    if (!user) {
      setIsRegistering(true);
      return;
    }

    if (user.energy < 10) {
      alert('Недостаточно энергии! Пополните баланс.');
      return;
    }

    if (messageText.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        username: user.username,
        avatar: user.avatar,
        text: messageText.trim(),
        timestamp: new Date(),
        reactions: []
      };

      setMessages([...messages, newMessage].slice(-10));
      setMessageText('');
      setUser({ ...user, energy: user.energy - 10 });
    }
  };

  const handleAddReaction = (messageId: number, emoji: string) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          return {
            ...msg,
            reactions: msg.reactions.map(r =>
              r.emoji === emoji ? { ...r, count: r.count + 1 } : r
            )
          };
        } else {
          return {
            ...msg,
            reactions: [...msg.reactions, { emoji, count: 1 }]
          };
        }
      }
      return msg;
    }));
  };

  const handleTopUp = (amount: number) => {
    if (user) {
      setUser({ ...user, energy: user.energy + amount });
      alert(`Пополнение на ${amount} энергии успешно!`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-2xl">
              ⚡
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">AuxChat</h1>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-lg">
                <Icon name="Zap" className="text-primary" size={20} />
                <span className="font-semibold text-foreground">{user.energy}</span>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Icon name="Plus" size={16} />
                    Пополнить
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Пополнение энергии</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => handleTopUp(50)} className="h-20 flex-col gap-1">
                        <span className="text-2xl">⚡</span>
                        <span className="text-sm">+50 энергии</span>
                        <span className="text-xs opacity-80">100 ₽</span>
                      </Button>
                      <Button onClick={() => handleTopUp(100)} className="h-20 flex-col gap-1">
                        <span className="text-2xl">⚡⚡</span>
                        <span className="text-sm">+100 энергии</span>
                        <span className="text-xs opacity-80">180 ₽</span>
                      </Button>
                      <Button onClick={() => handleTopUp(250)} className="h-20 flex-col gap-1">
                        <span className="text-2xl">⚡⚡⚡</span>
                        <span className="text-sm">+250 энергии</span>
                        <span className="text-xs opacity-80">400 ₽</span>
                      </Button>
                      <Button onClick={() => handleTopUp(500)} className="h-20 flex-col gap-1 bg-primary hover:bg-primary/90">
                        <span className="text-2xl">🔥</span>
                        <span className="text-sm">+500 энергии</span>
                        <span className="text-xs opacity-80">700 ₽</span>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Оплата через ЮКассу
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{user.avatar}</span>
                <span className="font-medium text-foreground">{user.username}</span>
              </div>
            </div>
          ) : (
            <Button onClick={() => setIsRegistering(true)} className="gap-2">
              <Icon name="UserPlus" size={18} />
              Войти
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        <Card className="h-[calc(100vh-220px)] flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-slide-up">
                <div className="flex gap-3">
                  <Avatar className="w-10 h-10 border-2 border-primary/20">
                    <AvatarFallback className="text-2xl">{msg.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{msg.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-3 mb-2">
                      <p className="text-foreground">{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {msg.reactions.map((reaction, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAddReaction(msg.id, reaction.emoji)}
                          className="bg-secondary/30 hover:bg-secondary/50 px-2 py-1 rounded-full text-sm flex items-center gap-1 transition-colors"
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-muted-foreground">{reaction.count}</span>
                        </button>
                      ))}
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="w-7 h-7 bg-secondary/20 hover:bg-secondary/40 rounded-full flex items-center justify-center transition-colors">
                            <Icon name="Plus" size={14} />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Добавить реакцию</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-6 gap-2 pt-4">
                            {reactionEmojis.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  handleAddReaction(msg.id, emoji);
                                  document.querySelector<HTMLButtonElement>('[data-state="open"]')?.click();
                                }}
                                className="text-3xl hover:scale-125 transition-transform p-2"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={user ? "Написать сообщение..." : "Войдите, чтобы отправить сообщение"}
                className="flex-1"
                disabled={!user}
              />
              <Button onClick={handleSendMessage} disabled={!user || !messageText.trim()} className="gap-2">
                <Icon name="Send" size={18} />
                {user ? '10 ⚡' : 'Войти'}
              </Button>
            </div>
          </div>
        </Card>
      </main>

      <Dialog open={isRegistering} onOpenChange={setIsRegistering}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Регистрация в AuxChat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите ваше имя"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Выберите аватар</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {avatars.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`text-3xl p-3 rounded-lg border-2 transition-all hover:scale-110 ${
                      selectedAvatar === avatar ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleRegister} disabled={!username.trim()} className="w-full">
              Зарегистрироваться и получить 100 ⚡
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
