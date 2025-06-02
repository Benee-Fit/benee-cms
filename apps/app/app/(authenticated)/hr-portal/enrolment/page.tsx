import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Enrolment | HR Portal',
  description: 'Manage employee enrollment and coverage changes',
};

export default function EnrolmentPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Enrolment Management</h1>
      </div>
      
      <div className="rounded-md border border-dashed p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Employee Enrolment Dashboard</h2>
        <p className="text-muted-foreground">
          This section will allow you to manage employee enrollment, make coverage changes, and submit enrollment forms.
        </p>
      </div>
    </div>
  );
}
