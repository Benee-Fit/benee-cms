'use client';

import { useState, useEffect } from 'react';
import { DocumentUpload } from '@/components/document-library/DocumentUpload';
import { DocumentList } from '@/components/document-library/DocumentList';

export default function DocumentLibraryPage() {
  // Use a counter to trigger document list refresh when a new document is uploaded
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize database when the page loads
  useEffect(() => {
    const initDb = async () => {
      try {
        setIsInitializing(true);
        // Call the init-db API route to ensure the database is set up
        await fetch('/api/init-db');
      } catch (error) {
        console.error('Error initializing database:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initDb();
  }, []);

  // Callback for when a document is uploaded successfully
  const handleUploadComplete = () => {
    // Increment the counter to trigger a refresh of the document list
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Document Library</h1>
      
      <p className="text-muted-foreground mb-8">
        Access all your important benefits-related documents in one place. This library contains plan booklets, monthly invoices, renewal documents, compliance notices, and other essential files. You can also upload your own documents for safekeeping and easy access.
      </p>
      
      {isInitializing ? (
        <div className="flex items-center justify-center p-12 border rounded-lg bg-muted/50">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-lg font-medium">Initializing document library...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document upload section */}
          <div className="lg:col-span-1">
            <DocumentUpload onUploadComplete={handleUploadComplete} />
          </div>
          
          {/* Document list section */}
          <div className="lg:col-span-2">
            <DocumentList refreshTrigger={refreshCounter} />
          </div>
        </div>
      )}
    </div>
  );
}
