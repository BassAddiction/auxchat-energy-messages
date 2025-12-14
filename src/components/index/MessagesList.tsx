import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Icon from "@/components/ui/icon";
import { Message, User } from "@/types";

interface MessagesListProps {
  messages: Message[];
  user: User | null;
  userId: number | null;
  messageText: string;
  displayLimit: number;
  initialLimit: number;
  onMessageTextChange: (text: string) => void;
  onSendMessage: () => void;
  onUsernameClick: (targetUserId: number, username: string) => void;
  onLoadMore: () => void;
  onAddReaction: (messageId: number, emoji: string) => void;
  canSendMessage: boolean;
}

export default function MessagesList({
  messages,
  user,
  userId,
  messageText,
  displayLimit,
  initialLimit,
  onMessageTextChange,
  onSendMessage,
  onUsernameClick,
  onLoadMore,
  onAddReaction,
  canSendMessage,
}: MessagesListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const displayedMessages = messages.slice(-displayLimit);
  const hasMore = messages.length > initialLimit;

  return (
    <>
      <main className="flex-1 overflow-y-auto px-2 md:px-3 py-3 space-y-2 md:space-y-3">
        {hasMore && displayLimit < messages.length && (
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              className="text-xs"
            >
              <Icon name="ChevronUp" size={14} className="mr-1" />
              Показать предыдущие
            </Button>
          </div>
        )}

        {displayedMessages.map((message) => (
          <Card
            key={message.id}
            className="p-2 md:p-3 hover:shadow-md transition-shadow"
          >
            <div className="flex gap-2 md:gap-3">
              <Avatar className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                <AvatarImage src={message.avatar} />
                <AvatarFallback>{message.username[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                  <button
                    onClick={() => onUsernameClick(message.userId, message.username)}
                    className="font-semibold text-xs md:text-sm hover:text-blue-600 transition-colors"
                  >
                    {message.username}
                  </button>
                  <span className="text-[10px] md:text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-700 break-words">
                  {message.text}
                </p>

                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex gap-1 mt-1.5 md:mt-2 flex-wrap">
                    {message.reactions.map((reaction) => (
                      <span
                        key={reaction.emoji}
                        className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                      >
                        {reaction.emoji} {reaction.count}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-1 mt-1.5 md:mt-2">
                  {["❤️", "👍", "😂", "🔥"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onAddReaction(message.id, emoji)}
                      className="text-xs md:text-sm hover:scale-125 transition-transform"
                      title="Добавить реакцию"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="sticky bottom-0 bg-white border-t border-gray-200 px-2 md:px-3 py-2 md:py-3 flex-shrink-0">
        {user ? (
          <div className="flex gap-1.5 md:gap-2">
            <Input
              placeholder={
                canSendMessage
                  ? "Напишите сообщение..."
                  : "Недостаточно энергии (нужно 1)"
              }
              value={messageText}
              onChange={(e) => onMessageTextChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              className="flex-1 text-sm md:text-base"
              disabled={!canSendMessage}
            />
            <Button
              onClick={onSendMessage}
              size="sm"
              disabled={!messageText.trim() || !canSendMessage}
              className="h-9 md:h-10"
            >
              <Icon name="Send" size={16} className="md:mr-1" />
              <span className="hidden md:inline">Отправить</span>
            </Button>
          </div>
        ) : (
          <p className="text-center text-sm text-gray-600">
            Войдите, чтобы отправлять сообщения
          </p>
        )}
      </footer>
    </>
  );
}
