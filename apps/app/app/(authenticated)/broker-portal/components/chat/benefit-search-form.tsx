'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Search } from 'lucide-react';

import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { ChatModal } from './chat-modal';

const formSchema = z.object({
  query: z.string().min(3, {
    message: 'Please enter at least 3 characters.',
  }),
});

type BenefitSearchFormProps = {
  className?: string;
};

export function BenefitSearchForm({ className }: BenefitSearchFormProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: '',
    },
  });

  return (
    <div className={className}>
      <div className="w-full">
        <Label htmlFor="search-query" className="text-lg font-medium tracking-tight mb-2 block">
          Have a question about your benefits?
        </Label>
        <form
          className="flex w-full items-center space-x-2"
          onSubmit={form.handleSubmit((values) => {
            // Open the chat modal with the query
            setCurrentQuery(values.query);
            setChatOpen(true);
            
            // Clear the input field after submitting
            form.reset({ query: '' });
          })}
          id="search-form"
        >
          <Input
            id="search-query"
            {...form.register('query')}
            type="text"
            placeholder="Ask about coverage, plans, or benefits..."
            className="flex-grow"
            aria-label="Benefit plan question"
          />
          <Button type="submit">
            <Search className="mr-2 h-4 w-4" />
            Ask a Question
          </Button>
        </form>
        {form.formState.errors.query && (
          <p className="text-sm text-destructive mt-2">{form.formState.errors.query.message}</p>
        )}
      </div>

      {/* Chat Modal */}
      <ChatModal
        trigger={<span className="hidden" />}
        isOpen={chatOpen}
        setIsOpen={setChatOpen}
        initialQuery={currentQuery}
      />
    </div>
  );
}
