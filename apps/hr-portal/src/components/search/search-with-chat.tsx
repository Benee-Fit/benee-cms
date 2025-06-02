import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChatModal } from '@/components/chat/chat-modal';
import { SearchIcon } from 'lucide-react';

type SearchWithChatProps = {
  placeholder?: string;
  onSearch?: (value: string) => void;
  className?: string;
};

export function SearchWithChat({ 
  placeholder = "Search documents...", 
  onSearch, 
  className = "" 
}: SearchWithChatProps) {
  const [value, setValue] = React.useState('');
  
  const handleSearch = () => {
    if (onSearch && value.trim()) {
      onSearch(value);
    }
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="pr-10"
        />
        <Button 
          type="submit" 
          variant="ghost" 
          size="icon" 
          className="absolute right-0 top-0 h-full" 
          onClick={handleSearch}
        >
          <SearchIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <ChatModal />
    </div>
  );
}
