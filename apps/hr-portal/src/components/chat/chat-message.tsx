import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Message } from './chat-context';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

type ChatMessageProps = {
  message: Message;
  isLastMessage?: boolean;
};

export function ChatMessage({ message, isLastMessage = false }: ChatMessageProps) {
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
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          ) : (
            <ReactMarkdown
              components={{
                // Override rendering for specific elements if needed
                p: ({ children }) => <p className="mb-2">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 list-disc pl-4">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 list-decimal pl-4">{children}</ol>,
                a: ({ href, children }) => <a href={href} className="text-primary underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                // @ts-ignore - react-markdown types don't match perfectly
                code: ({ node, inline, className, children, ...props }: any) => (
                  inline ? 
                    <code className="px-1 py-0.5 bg-muted-foreground/20 rounded text-xs">{children}</code> : 
                    <pre className="p-2 bg-muted-foreground/20 rounded overflow-auto text-xs"><code {...props}>{children}</code></pre>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
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
