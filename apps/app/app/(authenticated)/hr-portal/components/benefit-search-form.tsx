'use client';

import { useState, useTransition } from 'react';
import { Search, Loader2 } from 'lucide-react';

import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@repo/design-system/components/ui/alert';

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" disabled={isPending} aria-disabled={isPending}>
      {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
      Ask a Question
    </Button>
  );
}

export function BenefitSearchForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // For now, just show a success message with the query
  const handleSearch = (query: string) => {
    startTransition(() => {
      // This is a placeholder for the actual search functionality
      setSuccessMessage(`Your search for "${query}" was received.`);
    });
  };

  return (
    <section className="w-full py-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight mb-4 block">
          Have a question about your plan?
        </h2>
        <form
          className="flex w-full items-center space-x-2"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const query = formData.get('query')?.toString() || '';
            if (query.length < 3) {
              setError('Please enter at least 3 characters.');
              return;
            }
            setError(null);
            handleSearch(query);
            (e.target as HTMLFormElement).reset();
          }}
          id="search-form"
        >
          <Input
            id="search-query"
            name="query"
            type="text"
            placeholder="Ask about coverage, Pull information from benefit booklet..."
            className="flex-grow text-base"
            aria-label="Benefit plan question"
          />
          <SubmitButton isPending={isPending} />
        </form>
        {error && (
          <p className="text-sm text-destructive mt-2 text-left">{error}</p>
        )}
        {successMessage && !error && (
          <p className="text-sm text-green-600 mt-2 text-left">{successMessage}</p>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mt-8 max-w-2xl mx-auto">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
