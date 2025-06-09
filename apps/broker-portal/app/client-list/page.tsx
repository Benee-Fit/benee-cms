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
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageLayout } from '../page-layout';

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

// Expanded mock data generation (example)
const industries = [
  'Technology',
  'Agriculture',
  'Construction',
  'Healthcare',
  'Retail',
  'Finance',
  'Manufacturing',
  'Education',
  'Hospitality',
  'Logistics',
];
const companyNamePrefixes = [
  'Innovate',
  'Green',
  'Build',
  'Health',
  'Retail',
  'Fin',
  'Alpha',
  'Beta',
  'Omega',
  'Future',
  'Global',
  'National',
  'United',
];
const companyNameSuffixes = [
  'Solutions',
  'Organics',
  'Corp',
  'Clinics',
  'Stores',
  'Group',
  'Dynamics',
  'Systems',
  'Enterprises',
  'LLC',
  'Inc',
  'Worldwide',
];

const generateMockClients = (count: number): Client[] => {
  const mockClients: Client[] = [];
  const usedPolicyNumbers = new Set<string>();

  for (let i = 0; i < count; i++) {
    let policyNumber: string;
    do {
      policyNumber = `POL${Math.floor(10000 + Math.random() * 90000)}`;
    } while (usedPolicyNumbers.has(policyNumber));
    usedPolicyNumbers.add(policyNumber);

    const headcount = Math.floor(20 + Math.random() * 480); // 20 to 500
    const premiumPerHead = Math.floor(300 + Math.random() * 700); // $300 to $1000 per head
    const premium = headcount * premiumPerHead;
    const commissionRate = 0.1 + Math.random() * 0.05; // 10% to 15%
    const revenue = Math.floor(premium * commissionRate);
    const renewalYear = 2025 + Math.floor(Math.random() * 3); // 2025-2027
    const renewalMonth = Math.floor(1 + Math.random() * 12);
    const renewalDay = Math.floor(1 + Math.random() * 28);

    mockClients.push({
      id: `CL${String(i + 1).padStart(3, '0')}`,
      companyName: `${companyNamePrefixes[Math.floor(Math.random() * companyNamePrefixes.length)]} ${companyNameSuffixes[Math.floor(Math.random() * companyNameSuffixes.length)]}`,
      policyNumber,
      renewalDate: `${renewalYear}-${String(renewalMonth).padStart(2, '0')}-${String(renewalDay).padStart(2, '0')}`,
      headcount,
      premium,
      revenue,
      industry: industries[Math.floor(Math.random() * industries.length)],
    });
  }
  return mockClients;
};

const allClientsData = generateMockClients(120); // Generate 120 mock clients

export default function ClientListPage() {
  // State for the raw data - we won't modify this directly for display
  // const [allClients, setAllClients] = useState<Client[]>(allClientsData);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Client | null;
    direction: 'ascending' | 'descending';
  }>({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15); // Default to 15

  const sortedClients = useMemo(() => {
    const sortableClients = [...allClientsData]; // Use the full dataset
    const { key, direction } = sortConfig;
    if (key) {
      sortableClients.sort((a, b) => {
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
    return sortableClients;
  }, [sortConfig]); // Removed allClientsData from deps as it's constant for now

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Client List</h1>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Button>
        </div>

        <Card className="mb-6">
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSortRequest('companyName')}
                  >
                    <div className="flex items-center">
                      Company Name {getSortIcon('companyName')}
                    </div>
                  </TableHead>
                  <TableHead>Policy #</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSortRequest('renewalDate')}
                  >
                    <div className="flex items-center">
                      Renewal Date {getSortIcon('renewalDate')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSortRequest('headcount')}
                  >
                    <div className="flex items-center">
                      Headcount {getSortIcon('headcount')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSortRequest('premium')}
                  >
                    <div className="flex items-center justify-end">
                      Premium {getSortIcon('premium')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSortRequest('revenue')}
                  >
                    <div className="flex items-center justify-end">
                      Revenue {getSortIcon('revenue')}
                    </div>
                  </TableHead>
                  <TableHead>Industry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.companyName}
                    </TableCell>
                    <TableCell>{client.policyNumber}</TableCell>
                    <TableCell>{client.renewalDate}</TableCell>
                    <TableCell>{client.headcount}</TableCell>
                    <TableCell className="text-right">{`$${client.premium.toLocaleString()}`}</TableCell>
                    <TableCell className="text-right">{`$${client.revenue.toLocaleString()}`}</TableCell>
                    <TableCell>{client.industry}</TableCell>
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
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
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
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
