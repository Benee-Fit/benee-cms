import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Document Library | HR Portal',
  description: 'Access important plan documents and files',
};

export default function DocumentLibraryPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Document Library</h1>
      </div>
      
      <div className="rounded-md border border-dashed p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Document Repository</h2>
        <p className="text-muted-foreground">
          This section will provide access to important plan documents, booklets, invoices, and renewal information.
        </p>
      </div>
    </div>
  );
}
