'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { Card } from '@repo/design-system/components/ui/card';
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
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Plus,
  Upload,
  Edit,
  Trash,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageLayout } from '../page-layout';
import { ClientWizard } from '../../components/client-wizard';
import { MassUploadWizard } from '../../components/mass-upload-wizard';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Alert, AlertDescription } from '@repo/design-system/components/ui/alert';

interface Client {
  id: string;
  companyName: string;
  policyNumber: string;
  renewalDate: string;
  headcount: number;
  premium: number;
  revenue: number;
  industry: string;
}

export default function ClientListPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchTerm = searchParams.get('search') || '';
  
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showMassUpload, setShowMassUpload] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Client | null;
    direction: 'ascending' | 'descending';
  }>({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15); // Default to 15
  
  // Bulk edit state
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');

  // Fetch clients from API
  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/clients');
      const data = await response.json();
      
      // Transform data to match our interface
      const transformedClients = data.map((client: any) => ({
        id: client.id,
        companyName: client.companyName,
        policyNumber: client.policyNumber,
        renewalDate: new Date(client.renewalDate).toISOString().split('T')[0],
        headcount: client.headcount,
        premium: Number(client.premium),
        revenue: Number(client.revenue),
        industry: client.industry,
      }));
      
      setClients(transformedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle client row click - now navigates to /clients/[id]
  const handleClientClick = (clientId: string) => {
    if (!isEditMode) {
      router.push(`/clients/${clientId}`);
    }
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedClients.size === sortedClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(sortedClients.map(client => client.id)));
    }
  };

  // Toggle individual client selection
  const toggleClientSelection = (clientId: string) => {
    const newSelection = new Set(selectedClients);
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId);
    } else {
      newSelection.add(clientId);
    }
    setSelectedClients(newSelection);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedClients.size === 0) return;

    const deleteCount = selectedClients.size;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${deleteCount} client${deleteCount > 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      // Delete each selected client
      const deletePromises = Array.from(selectedClients).map(clientId =>
        fetch(`/api/clients/${clientId}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);

      // Refresh client list
      await fetchClients();
      
      // Clear selection and exit edit mode
      setSelectedClients(new Set());
      setIsEditMode(false);
      
      // Show success alert
      setAlertMessage(`${deleteCount} client${deleteCount > 1 ? 's' : ''} deleted successfully`);
      setAlertType('success');
      setShowAlert(true);
      
      // Hide alert after 3 seconds
      setTimeout(() => setShowAlert(false), 3000);
    } catch (error) {
      console.error('Error deleting clients:', error);
      
      // Show error alert
      setAlertMessage('Failed to delete clients. Please try again.');
      setAlertType('error');
      setShowAlert(true);
      
      // Hide alert after 5 seconds
      setTimeout(() => setShowAlert(false), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const sortedClients = useMemo(() => {
    // First, filter clients based on search term
    let filteredClients = [...clients];
    if (searchTerm) {
      filteredClients = clients.filter(client => 
        client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.industry.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Then sort the filtered results
    const { key, direction } = sortConfig;
    if (key) {
      filteredClients.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];
        if (valA < valB) {
          return direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return filteredClients;
  }, [clients, sortConfig, searchTerm]);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedClients.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedClients, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedClients.length / rowsPerPage);

  const handleSortRequest = (key: keyof Client) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page
  };

  const handlePageChange = (direction: 'next' | 'prev') => {
    setCurrentPage((prevPage) => {
      if (direction === 'next' && prevPage < totalPages) {
        return prevPage + 1;
      }
      if (direction === 'prev' && prevPage > 1) {
        return prevPage - 1;
      }
      return prevPage;
    });
  };

  // Helper to get sort icon
  const getSortIcon = (columnKey: keyof Client) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'ascending' ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  return (
    <PageLayout>
      <div className="container mx-auto pt-6">
        {showAlert && (
          <Alert 
            variant={alertType === 'error' ? 'destructive' : 'default'}
            className="mb-4"
          >
            <AlertDescription>{alertMessage}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Client List</h1>
            {searchTerm && (
              <p className="text-gray-600 mt-2">
                Showing results for "{searchTerm}" ({sortedClients.length} found)
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={selectedClients.size === 0 || isDeleting}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Selected ({selectedClients.size})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditMode(false);
                    setSelectedClients(new Set());
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setShowWizard(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Client
                </Button>
                <Button variant="outline" onClick={() => setShowMassUpload(true)}>
                  <Upload className="mr-2 h-4 w-4" /> Mass Upload
                </Button>
                <Button variant="outline" onClick={() => setIsEditMode(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit Client List
                </Button>
              </>
            )}
          </div>
        </div>

        <Card className={`${isEditMode ? 'border-orange-500' : ''}`}>
          <div className="px-4 py-3">
            {isEditMode && (
              <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md">
                <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                  Edit mode is active. Select clients to delete them.
                </p>
              </div>
            )}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-muted-foreground">Loading clients...</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <p className="text-muted-foreground">No clients found</p>
                <Button onClick={() => setShowWizard(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Your First Client
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {isEditMode && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedClients.size === sortedClients.length && sortedClients.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                      )}
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50 py-2 px-6 font-semibold text-gray-900"
                        onClick={() => handleSortRequest('companyName')}
                      >
                        <div className="flex items-center">
                          Company Name {getSortIcon('companyName')}
                        </div>
                      </TableHead>
                      <TableHead className="py-2 px-6 font-semibold text-gray-900">Policy #</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50 py-2 px-6 font-semibold text-gray-900"
                        onClick={() => handleSortRequest('renewalDate')}
                      >
                        <div className="flex items-center">
                          Renewal Date {getSortIcon('renewalDate')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50 py-2 px-6 font-semibold text-gray-900"
                        onClick={() => handleSortRequest('headcount')}
                      >
                        <div className="flex items-center">
                          Headcount {getSortIcon('headcount')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-gray-50 py-2 px-6 font-semibold text-gray-900"
                        onClick={() => handleSortRequest('premium')}
                      >
                        <div className="flex items-center justify-end">
                          Premium {getSortIcon('premium')}
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-gray-50 py-2 px-6 font-semibold text-gray-900"
                        onClick={() => handleSortRequest('revenue')}
                      >
                        <div className="flex items-center justify-end">
                          Revenue {getSortIcon('revenue')}
                        </div>
                      </TableHead>
                      <TableHead className="py-2 px-6 font-semibold text-gray-900">Industry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map((client) => (
                      <TableRow 
                        key={client.id}
                        className={`${!isEditMode ? 'cursor-pointer group' : ''} hover:bg-gray-50 transition-colors border-b border-gray-100`}
                        onClick={() => handleClientClick(client.id)}
                      >
                        {isEditMode && (
                          <TableCell className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedClients.has(client.id)}
                              onCheckedChange={() => toggleClientSelection(client.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-semibold text-gray-900 py-4 px-6">
                          <div className="flex items-center justify-between">
                            <span className={!isEditMode ? "group-hover:text-blue-600 transition-colors" : ""}>
                              {client.companyName}
                            </span>
                            {!isEditMode && (
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all ml-2" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 py-4 px-6">{client.policyNumber}</TableCell>
                        <TableCell className="text-gray-600 py-4 px-6">{client.renewalDate}</TableCell>
                        <TableCell className="text-gray-600 py-4 px-6">{client.headcount.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium text-gray-900 py-4 px-6">{`$${client.premium.toLocaleString()}`}</TableCell>
                        <TableCell className="text-right font-medium text-gray-900 py-4 px-6">{`$${client.revenue.toLocaleString()}`}</TableCell>
                        <TableCell className="text-gray-600 py-4 px-6">{client.industry}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <Select
                  value={String(rowsPerPage)}
                  onValueChange={handleRowsPerPageChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Rows per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 rows per page</SelectItem>
                    <SelectItem value="30">30 rows per page</SelectItem>
                    <SelectItem value="50">50 rows per page</SelectItem>
                    <SelectItem value="100">100 rows per page</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                {!isEditMode && sortedClients.length > 0 && (
                  <span className="text-xs text-gray-500 italic">
                    Click any row to view client details
                  </span>
                )}
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange('prev')}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange('next')}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
            </>
            )}
          </div>
        </Card>
      </div>

      <ClientWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={() => {
          setShowWizard(false);
          fetchClients();
        }}
      />

      <MassUploadWizard
        open={showMassUpload}
        onClose={() => setShowMassUpload(false)}
        onSuccess={() => {
          setShowMassUpload(false);
          fetchClients();
        }}
      />
    </PageLayout>
  );
}