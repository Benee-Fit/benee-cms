'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Trash2, 
  Search, 
  FileText, 
  Calendar, 
  Tag,
  AlertCircle,
  Loader2,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DocumentMetadata } from '@/lib/storage/storage-interface';
import { DocumentPreview } from './DocumentPreview';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

// Document types for filtering
const documentTypes = [
  'All Types',
  'Benefits Booklet',
  'Claim',
  'Compliance Notice',
  'Contract',
  'Dental',
  'Disability',
  'Employee Census',
  'Form',
  'Invoice',
  'Life Insurance',
  'Medical',
  'Renewal',
  'Vision',
  'Policy',
  'Other'
];

// Date filter options
const dateFilterOptions = [
  { label: 'Any time', value: 'any' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: 'week' },
  { label: 'Last 30 days', value: 'month' },
  { label: 'Last 90 days', value: 'quarter' },
  { label: 'Last year', value: 'year' }
];

interface DocumentListProps {
  refreshTrigger: number;
}

export function DocumentList({ refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [dateSort, setDateSort] = useState<'asc' | 'desc'>('desc');
  const [dateFilter, setDateFilter] = useState('any');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [bulkActionInProgress, setBulkActionInProgress] = useState(false);

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/documents');
        
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching documents');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [refreshTrigger]);

  // Handle document deletion
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setIsDeleting(id);
      
      try {
        const response = await fetch(`/api/documents/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete document');
        }
        
        // Remove document from list
        setDocuments(documents.filter(doc => doc.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while deleting the document');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Handle bulk selection toggle
  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  // Handle individual document selection
  const toggleDocumentSelection = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, id]);
    } else {
      setSelectedDocuments(prev => prev.filter(docId => docId !== id));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedDocuments.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedDocuments.length} document(s)?`)) {
      setBulkActionInProgress(true);
      
      try {
        // Delete each selected document
        const deletePromises = selectedDocuments.map(id => 
          fetch(`/api/documents/${id}`, { method: 'DELETE' })
        );
        
        await Promise.all(deletePromises);
        
        // Remove deleted documents from list
        setDocuments(documents.filter(doc => !selectedDocuments.includes(doc.id)));
        setSelectedDocuments([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while deleting documents');
      } finally {
        setBulkActionInProgress(false);
      }
    }
  };

  // Get date for filtering
  const getDateFilterValue = (filterValue: string): Date | null => {
    const now = new Date();
    switch (filterValue) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
      case 'week':
        const week = new Date();
        week.setDate(week.getDate() - 7);
        return week;
      case 'month':
        const month = new Date();
        month.setDate(month.getDate() - 30);
        return month;
      case 'quarter':
        const quarter = new Date();
        quarter.setDate(quarter.getDate() - 90);
        return quarter;
      case 'year':
        const year = new Date();
        year.setFullYear(year.getFullYear() - 1);
        return year;
      default:
        return null;
    }
  };

  // Filter and sort documents
  const filteredDocuments = documents
    .filter(doc => {
      // Apply search filter
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply type filter
      const matchesType = typeFilter === 'All Types' || doc.documentType === typeFilter;
      
      // Apply date filter
      const dateFilterValue = getDateFilterValue(dateFilter);
      const matchesDate = dateFilterValue === null || 
                         new Date(doc.uploadDate) >= dateFilterValue;
      
      return matchesSearch && matchesType && matchesDate;
    })
    .sort((a, b) => {
      // Sort by upload date
      const dateA = new Date(a.uploadDate).getTime();
      const dateB = new Date(b.uploadDate).getTime();
      
      return dateSort === 'asc' ? dateA - dateB : dateB - dateA;
    });

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Document Library</CardTitle>
        <div className="flex items-center gap-2">
          {selectedDocuments.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-2 py-1">
                {selectedDocuments.length} selected
              </Badge>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkActionInProgress}
              >
                {bulkActionInProgress ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                Delete
              </Button>
            </div>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-1" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle advanced filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        {/* Basic Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by title or filename"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-md bg-muted/30">
            {/* Document type filter */}
            <div className="space-y-2">
              <Label htmlFor="type-filter">Document Type</Label>
              <Select
                value={typeFilter}
                onValueChange={setTypeFilter}
              >
                <SelectTrigger id="type-filter" className="w-full">
                  <div className="flex items-center">
                    <Tag className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date filter */}
            <div className="space-y-2">
              <Label htmlFor="date-filter">Date Range</Label>
              <Select
                value={dateFilter}
                onValueChange={setDateFilter}
              >
                <SelectTrigger id="date-filter" className="w-full">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by date" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {dateFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date sort */}
            <div className="space-y-2">
              <Label htmlFor="date-sort">Sort Order</Label>
              <Select
                value={dateSort}
                onValueChange={(value) => setDateSort(value as 'asc' | 'desc')}
              >
                <SelectTrigger id="date-sort" className="w-full">
                  <div className="flex items-center">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort by date" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12 border rounded-md bg-muted/50">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No documents found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {documents.length === 0
                ? 'Upload your first document to get started'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[5%]">
                    <Checkbox 
                      checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                      onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                      aria-label="Select all documents"
                    />
                  </TableHead>
                  <TableHead className="w-[35%]">Document</TableHead>
                  <TableHead className="w-[15%]">Type</TableHead>
                  <TableHead className="w-[15%]">Upload Date</TableHead>
                  <TableHead className="w-[10%]">Size</TableHead>
                  <TableHead className="w-[20%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedDocuments.includes(doc.id)}
                        onCheckedChange={(checked) => toggleDocumentSelection(doc.id, !!checked)}
                        aria-label={`Select ${doc.title}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-start">
                        <FileText className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{doc.title}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {doc.fileName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {doc.documentType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="cursor-default">
                            {format(new Date(doc.uploadDate), 'MMM d, yyyy')}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{format(new Date(doc.uploadDate), 'MMMM d, yyyy h:mm a')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {doc.size < 1024 * 1024
                        ? `${(doc.size / 1024).toFixed(1)} KB`
                        : `${(doc.size / (1024 * 1024)).toFixed(1)} MB`}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <DocumentPreview documentId={doc.id} documentTitle={doc.title} />
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a href={`/api/documents/${doc.id}`} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(doc.id)}
                          disabled={isDeleting === doc.id}
                        >
                          {isDeleting === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
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
  );
}
