import { useEffect, useRef } from 'react';
import { useChat } from './chat-context';
import { DocumentMetadata } from '@/lib/storage/storage-interface';

// Document types to auto-select
const AUTO_DOCUMENT_TYPES = ['Benefits Booklet', 'Renewal'];

/**
 * AutoDocumentSelector - Silently selects documents with specified types
 * 
 * This component doesn't render any UI but handles automatic document selection
 * based on document types defined in AUTO_DOCUMENT_TYPES.
 */
export function AutoDocumentSelector() {
  const { 
    setSelectedDocuments, 
    processDocuments, 
    selectedDocuments,
    setIsLoadingDocuments 
  } = useChat();
  // Flag to track if documents have been processed already
  const hasProcessedDocuments = useRef(false);

  // Auto-fetch and select documents on component mount
  useEffect(() => {
    // Skip if documents are already selected or if we've already run the processing
    if (selectedDocuments.length > 0 || hasProcessedDocuments.current) {
      return;
    }
    
    // Mark as processed to prevent duplicate requests
    hasProcessedDocuments.current = true;
    
    // Set loading state to true while fetching documents
    setIsLoadingDocuments(true);
    
    const fetchAndSelectDocuments = async () => {
      try {
        // Fetch all available documents
        const response = await fetch('/api/documents');
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        
        const allDocuments: DocumentMetadata[] = await response.json();
        
        // Filter documents by type
        const filteredDocuments = allDocuments.filter(doc => 
          AUTO_DOCUMENT_TYPES.includes(doc.documentType)
        );
        
        if (filteredDocuments.length === 0) {
          console.log('No matching documents found for auto-selection');
          return;
        }
        
        // Process the filtered documents
        const documentIds = filteredDocuments.map(doc => doc.id);
        const processedDocs = await processDocuments(documentIds);
        
        // Set as selected documents
        if (processedDocs && processedDocs.length > 0) {
          setSelectedDocuments(processedDocs);
          console.log(`Auto-selected ${processedDocs.length} documents`);
        }
        
        // Turn off loading state when documents are processed
        setIsLoadingDocuments(false);
      } catch (error) {
        console.error('Error in auto document selection:', error);
        // Also turn off loading state in case of error
        setIsLoadingDocuments(false);
      }
    };
    
    fetchAndSelectDocuments();
  }, [processDocuments, setSelectedDocuments]);
  
  // This component doesn't render anything
  return null;
}
