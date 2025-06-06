'use client';

import { PageLayout } from '../page-layout';
import { Alert, AlertDescription } from '@repo/design-system/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/design-system/components/ui/table';
import { Card } from '@repo/design-system/components/ui/card';

export default function ClientListPage() {
  // This is placeholder data - in a real implementation, this would come from an API
  const placeholderClients = [
    { id: 1, name: 'Acme Corporation', industry: 'Technology', employees: 250, status: 'Active' },
    { id: 2, name: 'Globex', industry: 'Manufacturing', employees: 450, status: 'Active' },
    { id: 3, name: 'Initech', industry: 'Finance', employees: 120, status: 'Pending' },
  ];

  return (
    <PageLayout>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Client List</h1>
        
        <Alert className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Full client management functionality is coming soon. This page will allow you to view and manage all your clients.
          </AlertDescription>
        </Alert>
        
        <Card className="mb-6">
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placeholderClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.industry}</TableCell>
                    <TableCell>{client.employees}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        client.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {client.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
