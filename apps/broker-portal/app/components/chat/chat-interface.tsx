import type React from 'react';
import { useRef, useEffect, useState } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { ScrollArea } from '@repo/design-system/components/ui/scroll-area';
import { Separator } from '@repo/design-system/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { useChat } from './chat-context';
import { ChatMessage } from './chat-message';
import { SendIcon } from 'lucide-react';

type ChatInterfaceProps = {
  initialQuery?: string;
};

export function ChatInterface(_props: ChatInterfaceProps = {}) {
  const { messages, isLoading, sendMessage, selectedDocuments, isLoadingDocuments } = useChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus the input field when component mounts
  useEffect(() => {
    // This component doesn't need to handle sending initialQuery
    // That's now handled by the ChatProvider
    
    // Focus the input field when the component mounts
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // Small delay to ensure modal is fully open
    }
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
  
  // Handle message submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };
  
  // Check if benefits documents are available
  const benefitsDocumentsAvailable = selectedDocuments.length > 0;
  
  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="p-4 flex flex-row justify-between items-center space-y-0">
        <CardTitle className="text-lg">Benefits Assistant</CardTitle>
      </CardHeader>
      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 pb-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-center text-muted-foreground">
              {isLoadingDocuments ? (
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
                  <div>Gathering relevant documents...</div>
                </div>
              ) : (
                benefitsDocumentsAvailable 
                  ? "Ask a question about your benefits or insurance coverage"
                  : "No benefits documents found. Please contact your HR administrator."
              )}
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message}
              />
            ))
          )}
          
          {isLoading && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
              <span>Thinking...</span>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      
      <Separator />
      
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            ref={inputRef}
            placeholder={
              isLoadingDocuments ? "Gathering relevant documents..." :
              (benefitsDocumentsAvailable ? "Ask a question about your benefits..." : "No benefits documents available")
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || isLoadingDocuments || !benefitsDocumentsAvailable}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || isLoadingDocuments || !benefitsDocumentsAvailable || !input.trim()}
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
