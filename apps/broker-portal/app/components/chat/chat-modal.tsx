'use client';

import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/design-system/components/ui/dialog';
import { Button } from '@repo/design-system/components/ui/button';
import { ChatProvider, useChat } from './chat-context';
import { ChatInterface } from './chat-interface';
import { AutoDocumentSelector } from './auto-document-selector';
import { MessageSquareIcon } from 'lucide-react';

type ChatModalProps = {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  initialQuery?: string;
};

// Inner component that has access to the ChatContext
function ChatModalContent({ isOpen, initialQuery }: { isOpen: boolean; initialQuery?: string }) {
  const { clearChat } = useChat();
  const prevIsOpenRef = useRef(isOpen);
  
  // Use an effect to detect when the modal closes
  useEffect(() => {
    // If the modal was open and is now closing, clear the chat
    if (prevIsOpenRef.current && !isOpen) {
      clearChat();
    }
    
    // Update the ref to track the current state
    prevIsOpenRef.current = isOpen;
  }, [isOpen, clearChat]);
  
  return (
    <>
      <DialogHeader className="px-4 py-2 border-b">
        <DialogTitle>Benefits Assistant</DialogTitle>
      </DialogHeader>
      <div className="p-4 w-full">
        {/* AutoDocumentSelector runs silently without UI */}
        <AutoDocumentSelector />
        {/* Chat interface now takes full width */}
        <ChatInterface initialQuery={initialQuery} />
      </div>
    </>
  );
}

export function ChatModal({ trigger, isOpen, setIsOpen, initialQuery }: ChatModalProps) {
  // Use internal state if external control props aren't provided
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  // Determine if we're using controlled or uncontrolled behavior
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const onOpenChange = (newOpen: boolean) => {
    (setIsOpen || setInternalOpen)(newOpen);
  };
  
  return (
    <ChatProvider initialQuery={initialQuery}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="icon" aria-label="Chat with documents">
              <MessageSquareIcon className="h-4 w-4" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] p-0">
          <ChatModalContent isOpen={open} initialQuery={initialQuery} />
        </DialogContent>
      </Dialog>
    </ChatProvider>
  );
}
