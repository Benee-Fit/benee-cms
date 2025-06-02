import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useChat, DocumentInfo } from './chat-context';
import { FileIcon, RefreshCwIcon } from 'lucide-react';
import { DocumentMetadata } from '@/lib/storage/storage-interface';

export function DocumentSelector() {
  const { selectedDocuments, setSelectedDocuments, processDocuments } = useChat();
  const [availableDocuments, setAvailableDocuments] = useState<DocumentMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingDocs, setProcessingDocs] = useState<string[]>([]);
  
  // Fetch available documents
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      setAvailableDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);
  
  // Handle document selection
  const toggleDocument = async (document: DocumentMetadata) => {
    const isSelected = selectedDocuments.some((doc) => doc.id === document.id);
    
    if (isSelected) {
      // Remove document if already selected
      setSelectedDocuments(selectedDocuments.filter((doc) => doc.id !== document.id));
    } else {
      // Don't allow more than 10 documents
      if (selectedDocuments.length >= 10) {
        alert('You can select a maximum of 10 documents');
        return;
      }
      
      // Process document if not already processed
      setProcessingDocs((prev) => [...prev, document.id]);
      
      try {
        const processedDocs = await processDocuments([document.id]);
        if (processedDocs && processedDocs.length > 0) {
          setSelectedDocuments([...selectedDocuments, processedDocs[0]]);
        }
      } catch (error) {
        console.error('Error processing document:', error);
        alert('Failed to process document');
      } finally {
        setProcessingDocs((prev) => prev.filter((id) => id !== document.id));
      }
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Select Documents</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchDocuments}
          disabled={isLoading}
        >
          <RefreshCwIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        ) : availableDocuments.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No documents available
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {availableDocuments.map((document) => (
              <div
                key={document.id}
                className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                onClick={() => toggleDocument(document)}
              >
                <Checkbox
                  checked={selectedDocuments.some((doc) => doc.id === document.id)}
                  onCheckedChange={() => toggleDocument(document)}
                />
                <FileIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium flex-1 truncate">{document.title}</span>
                {processingDocs.includes(document.id) && <Spinner size="sm" />}
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 text-xs text-muted-foreground">
          Selected: {selectedDocuments.length}/10
        </div>
      </CardContent>
    </Card>
  );
}
