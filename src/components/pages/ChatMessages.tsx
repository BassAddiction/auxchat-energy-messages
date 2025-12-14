import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Icon from "@/components/ui/icon";
import { Message, User } from "@/types";

interface ChatMessagesProps {
  messages: Message[];
  subscribedUsers: Set<number>;
  userId: number | null;
  user: User | null;
  displayLimit: number;
  initialLimit: number;
  onDisplayLimitChange: (limit: number) => void;
  onOpenSubscriptionModal: (userId: number, username: string) => void;
  messageText: string;
  onMessageTextChange: (text: string) => void;
  onSendMessage: () => void;
  geoRadius: number;
  onGeoRadiusModalOpen: () => void;
}

export default function ChatMessages({
  messages,
  subscribedUsers,
  userId,
  user,
  displayLimit,
  initialLimit,
  onDisplayLimitChange,
  onOpenSubscriptionModal,
  messageText,
  onMessageTextChange,
  onSendMessage,
  geoRadius,
  onGeoRadiusModalOpen,
}: ChatMessagesProps) {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="flex-1 overflow-y-auto space-y-2 px-2 md:px-3 pb-2 pt-2 max-w-3xl mx-auto w-full">
        {displayLimit < messages.length && (
          <div className="text-center pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDisplayLimitChange(displayLimit + initialLimit)}
            >
              <Icon name="ChevronUp" size={16} className="mr-2" />
              Показать предыдущие {initialLimit}
            </Button>
          </div>
        )}
        {messages.slice(-displayLimit).map((msg) => {
          const isSubscribedUser = subscribedUsers.has(msg.userId);
          return (
            <div
              key={msg.id}
              className={`flex gap-2 p-2 md:p-3 rounded-lg transition-colors shadow-sm hover:shadow-md ${
                isSubscribedUser
                  ? "bg-purple-50 hover:bg-purple-100 ring-2 ring-purple-300"
                  : "bg-white/60 hover:bg-white/80"
              }`}
            >
              <button onClick={() => navigate(`/profile/${msg.userId}`)}>
                <Avatar className="cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all h-9 w-9 md:h-10 md:w-10 flex-shrink-0">
                  <AvatarImage src={msg.avatar} alt={msg.username} />
                  <AvatarFallback>{msg.username[0]}</AvatarFallback>
                </Avatar>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 md:gap-1.5 mb-0.5">
                  <button
                    onClick={() => navigate(`/profile/${msg.userId}`)}
                    className="font-semibold text-xs md:text-sm hover:text-purple-500 transition-colors truncate max-w-[120px] md:max-w-none"
                  >
                    {msg.username}
                  </button>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {msg.timestamp.toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs md:text-sm mb-1 md:mb-1.5 break-words leading-relaxed">
                  {msg.text}
                </p>
                {msg.userId !== userId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 md:h-7 px-2 md:px-3 text-[11px] md:text-xs -ml-2"
                    onClick={() =>
                      onOpenSubscriptionModal(msg.userId, msg.username)
                    }
                  >
                    <Icon name="Plus" size={12} className="mr-0.5 md:mr-1" />
                    Отслеживать
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 p-3 md:p-4 border-t bg-white flex-shrink-0 z-10 max-w-3xl mx-auto"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
      >
        <div className="space-y-2">
          <div className="relative flex items-end">
            <textarea
              placeholder={
                user ? "Напишите сообщение..." : "Войдите для отправки"
              }
              value={messageText}
              onChange={(e) => onMessageTextChange(e.target.value.slice(0, 140))}
              onKeyPress={(e) =>
                e.key === "Enter" && !e.shiftKey && onSendMessage()
              }
              disabled={!user}
              maxLength={140}
              rows={1}
              className="flex-1 pl-4 pr-14 py-3 rounded-3xl border-2 border-gray-200 bg-gray-50 resize-none focus:outline-none focus:border-red-400 focus:bg-white disabled:opacity-50 text-base transition-all"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
            {messageText.trim() && (
              <Button
                onClick={onSendMessage}
                disabled={!user}
                className="absolute right-1.5 bottom-1.5 h-9 w-9 p-0 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all"
              >
                <Icon name="Send" size={18} className="ml-0.5" />
              </Button>
            )}
          </div>
          {user && (
            <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
              <button
                onClick={onGeoRadiusModalOpen}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <Icon name="MapPin" size={12} />
                <span>Радиус: {geoRadius} км</span>
              </button>
              <span className={messageText.length > 120 ? "text-red-500" : ""}>
                {messageText.length}/140
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
