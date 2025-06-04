import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Types for chat messages
export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

// Types for document metadata
export type DocumentInfo = {
  id: string;
  title: string;
  fileName: string;
  pageCount?: number;
  chunks?: string[];
};

// Type for the chat context
type ChatContextType = {
  messages: Message[];
  selectedDocuments: DocumentInfo[];
  isLoading: boolean;
  isLoadingDocuments: boolean;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  setSelectedDocuments: (documents: DocumentInfo[]) => void;
  clearChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  processDocuments: (documentIds: string[]) => Promise<DocumentInfo[]>;
  setIsLoadingDocuments: (isLoading: boolean) => void;
};

// Create the context
export const ChatContext = createContext<ChatContextType>({} as ChatContextType);

// Chat provider props
type ChatProviderProps = {
  children: ReactNode;
  initialQuery?: string;
};

// Chat provider component
export function ChatProvider({ children, initialQuery }: ChatProviderProps) {
  // Generate a unique session ID to prevent duplicate requests
  const sessionId = useRef(uuidv4());
  
  // Track if we've processed the initial query
  // This ref is crucial for preventing infinite loops
  const initialQueryProcessed = useRef<string | null>(null);

  // Don't pre-populate messages with initialQuery
  // We'll add it later when documents are loaded
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true); // Start with loading documents
  
  // Add a message to the chat
  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${role}-${Date.now()}`,
        role,
        content,
        timestamp: new Date(),
      },
    ]);
  }, []);
  
  // Clear the chat history
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);
  
  // Process selected documents
  const processDocuments = useCallback(async (documentIds: string[]): Promise<DocumentInfo[]> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/chat/process-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentIds }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process documents');
      }
      
      const data = await response.json();
      return data.documents;
    } catch (error) {
      console.error('Error processing documents:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Send a message to the chat
  const sendMessage = useCallback(async (content: string, skipAddingUserMessage = false) => {
    try {
      // Skip if message is empty or no documents selected
      if (!content.trim() || selectedDocuments.length === 0) return;
      
      // Add user message if not already added
      if (!skipAddingUserMessage) {
        addMessage('user', content);
      }
      
      // Set loading state
      setIsLoading(true);
      
      // Prepare chat history for context (limited to relevant exchanges)
      const history = messages.reduce<{ role: string; text: string }[]>((acc, msg, i, arr) => {
        // Only include complete exchanges (user followed by assistant)
        if (msg.role === 'user' && i + 1 < arr.length && arr[i + 1].role === 'assistant') {
          acc.push({ role: 'user', text: msg.content });
          acc.push({ role: 'model', text: arr[i + 1].content });
        }
        return acc;
      }, []);
      
      // Include session ID to prevent duplicate processing
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: content,
          relevantPdfIds: selectedDocuments.map(doc => doc.id), // Only send IDs, not full document data
          chatHistory: history,
          sessionId: sessionId.current, // Include session ID to prevent duplicates
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Add assistant message
      addMessage('assistant', data.response);
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('assistant', 'Sorry, there was an error processing your request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [messages, selectedDocuments, addMessage]);
  
  // Handle initial query if provided
  useEffect(() => {
    // Only process initial query when documents are available and only once per query
    if (initialQuery && 
        initialQuery.trim() && 
        initialQueryProcessed.current !== initialQuery && 
        selectedDocuments.length > 0 && 
        !isLoading && 
        !isLoadingDocuments) {
      
      console.log('Processing initial query:', initialQuery);
      
      // Store the exact query we're processing to prevent reprocessing
      initialQueryProcessed.current = initialQuery;
      
      // First add the message to the UI
      addMessage('user', initialQuery);
      
      // Then send it to the API (with skipAddingUserMessage=true)
      sendMessage(initialQuery, true);
    }
  }, [initialQuery, selectedDocuments, isLoading, isLoadingDocuments, sendMessage, addMessage]);
  
  // Reset the initialQueryProcessed when initialQuery changes or component unmounts
  useEffect(() => {
    return () => {
      // Only reset if the new initialQuery is different from what we processed
      if (initialQueryProcessed.current !== initialQuery) {
        initialQueryProcessed.current = null;
      }
    };
  }, [initialQuery]);
  
  return (
    <ChatContext.Provider
      value={{
        messages,
        selectedDocuments,
        isLoading,
        isLoadingDocuments,
        addMessage,
        setSelectedDocuments,
        clearChat,
        sendMessage,
        processDocuments,
        setIsLoadingDocuments,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// Custom hook to use the chat context
export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
