'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Badge } from '@repo/design-system/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/design-system/components/ui/tooltip';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import {
  FileText,
  Download,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  Eye,
} from 'lucide-react';
import { DocumentPreview } from './DocumentPreview';

interface ClientDocument {
  id: string;
  fileName: string;
  documentType: string;
  uploadDate: string;
  fileUrl: string;
  fileType: string;
  description?: string;
}

interface DocumentListProps {
  clientId: string;
  refreshTrigger?: number;
}

// Document type labels
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  benefits_booklet: 'Benefits Booklet',
  claim: 'Claim',
  compliance_notice: 'Compliance Notice',
  contract: 'Contract',
  employee_census: 'Employee Census',
  form: 'Form',
  invoice: 'Invoice',
  renewal: 'Renewal',
  other: 'Other',
};

export function DocumentList({ clientId, refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<ClientDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [previewDocument, setPreviewDocument] = useState<ClientDocument | null>(null);

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/clients/${clientId}/documents`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      setDocuments(data);
      setFilteredDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch documents on mount and when refreshTrigger changes
  useEffect(() => {
    fetchDocuments();
  }, [clientId, refreshTrigger]);

  // Apply filters
  useEffect(() => {
    let filtered = [...documents];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter((doc) => doc.documentType === selectedType);
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.uploadDate).getTime();
      const dateB = new Date(b.uploadDate).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, selectedType, sortOrder]);

  // Handle select all
  const handleSelectAll = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map((doc) => doc.id)));
    }
  };

  // Handle individual selection
  const handleSelectDocument = (docId: string) => {
    const newSelection = new Set(selectedDocuments);
    if (newSelection.has(docId)) {
      newSelection.delete(docId);
    } else {
      newSelection.add(docId);
    }
    setSelectedDocuments(newSelection);
  };

  // Handle delete
  const handleDelete = async (docId?: string) => {
    const docsToDelete = docId ? [docId] : Array.from(selectedDocuments);
    
    if (docsToDelete.length === 0) return;

    const confirmMessage = docId
      ? 'Are you sure you want to delete this document?'
      : `Are you sure you want to delete ${docsToDelete.length} document(s)?`;

    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      const deletePromises = docsToDelete.map((id) =>
        fetch(`/api/clients/${clientId}/documents/${id}`, {
          method: 'DELETE',
        })
      );

      await Promise.all(deletePromises);
      
      // Refresh documents
      await fetchDocuments();
      
      // Clear selection
      setSelectedDocuments(new Set());
    } catch (error) {
      console.error('Error deleting documents:', error);
      alert('Failed to delete some documents. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get unique document types
  const documentTypes = Array.from(new Set(documents.map((doc) => doc.documentType)));

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents ({filteredDocuments.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {showFilters ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          {showFilters && (
            <div className="space-y-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Type Filter */}
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {DOCUMENT_TYPE_LABELS[type] || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select
                  value={sortOrder}
                  onValueChange={(value) => setSortOrder(value as 'newest' | 'oldest')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Actions */}
              {selectedDocuments.size > 0 && (
                <div className="flex items-center gap-4 mt-4">
                  <span className="text-sm text-gray-600">
                    {selectedDocuments.size} selected
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete()}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Documents Table */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-muted-foreground">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <FileText className="h-12 w-12 text-gray-400" />
              <p className="text-muted-foreground">
                {searchTerm || selectedType !== 'all'
                  ? 'No documents match your filters'
                  : 'No documents uploaded yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedDocuments.size === filteredDocuments.length &&
                          filteredDocuments.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedDocuments.has(doc.id)}
                          onCheckedChange={() => handleSelectDocument(doc.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">{doc.description || doc.fileName}</p>
                            {doc.description && (
                              <p className="text-sm text-gray-500">{doc.fileName}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span>{formatDate(doc.uploadDate)}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {new Date(doc.uploadDate).toLocaleString()}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPreviewDocument(doc)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Preview</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                >
                                  <a href={doc.fileUrl} download>
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Download</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(doc.id)}
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      {previewDocument && (
        <DocumentPreview
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </>
  );
}