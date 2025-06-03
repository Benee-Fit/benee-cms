import { Avatar, AvatarFallback } from '@repo/design-system/components/ui/avatar';
import { cn } from '@repo/design-system/lib/utils';
import type { Message } from './chat-context';
import { Bot, User } from 'lucide-react';

type ChatMessageProps = {
  message: Message;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div 
      className={cn(
        "flex gap-3 text-sm mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 bg-primary/10">
          <AvatarFallback className="text-primary">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "px-4 py-3 rounded-lg max-w-[80%]",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted"
      )}>
        <div className={cn(
          "prose prose-sm max-w-none",
          isUser ? "prose-invert" : ""
        )}>
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        </div>
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8 bg-primary">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
