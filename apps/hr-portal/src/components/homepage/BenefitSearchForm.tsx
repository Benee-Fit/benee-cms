'use client';

import { useActionState } from 'react';  // Updated from useFormState
import { useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Search, Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { handleSearchQuery, type SearchState } from '@/app/actions';
import { useEffect } from 'react';
import { ChatModal } from '@/components/chat/chat-modal';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  query: z.string().min(3, {
    message: 'Please enter at least 3 characters.',
  }),
});

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
      Ask a Question
    </Button>
  );
}

export function BenefitSearchForm() {
  const { toast } = useToast();
  const initialState: SearchState = {};
  const [chatOpen, setChatOpen] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(handleSearchQuery, initialState);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: '',
    },
  });

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: "destructive",
        title: "Search Error",
        description: state.error,
      });
    }
  }, [state?.error, state?.timestamp, toast]);


  return (
    <section className="w-full py-8 md:py-12">
      <div className="mx-auto max-w-2xl text-center">
        <Label htmlFor="search-query" className="text-2xl font-semibold tracking-tight mb-4 block">
          Have a question about your plan?
        </Label>
        <form
          className="flex w-full items-center space-x-2"
          onSubmit={form.handleSubmit((values) => {
            // Instead of submitting the form, open the chat modal with the query
            setCurrentQuery(values.query);
            setChatOpen(true);
            
            // Clear the input field after submitting
            form.reset({ query: '' });

            // Keep the original form action for backward compatibility
            // You can comment this out if you only want the chatbot functionality
            // Wrap the formAction call in startTransition to avoid the error
            startTransition(() => {
              const formData = new FormData();
              formData.append('query', values.query);
              formAction(formData);
            });
          })}
          id="search-form"
        >
          <Input
            id="search-query"
            {...form.register('query')}
            type="text"
            placeholder="Ask about coverage, Pull information form benefit booklet..."
            className="flex-grow text-base"
            aria-label="Benefit plan question"
            defaultValue={state?.query || ''} // Persist query on error
          />
          <SubmitButton />
        </form>
        {form.formState.errors.query && (
          <p className="text-sm text-destructive mt-2 text-left">{form.formState.errors.query.message}</p>
        )}
      </div>

      {state?.error && !state.result && ( // Only show this general error if no specific toast is shown by useEffect
        <Alert variant="destructive" className="mt-8 max-w-2xl mx-auto">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Chat Modal */}
      <ChatModal
        trigger={<span className="hidden" />}
        isOpen={chatOpen}
        setIsOpen={setChatOpen}
        initialQuery={currentQuery}
      />
    </section>
  );
}
