"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  User, 
  Building, 
  Calendar, 
  DollarSign,
  Tag,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

interface ClaimDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  claimId?: string;
  divisionName?: string;
}

export function ClaimDetails({ 
  isOpen, 
  onClose, 
  claimId,
  divisionName
}: ClaimDetailsProps) {
  const [loading, setLoading] = useState(false);

  // In a real app, this would fetch the claim details from an API
  const claimDetails = {
    id: claimId || "CLM-12345",
    employeeName: "John Smith",
    employeeId: "EMP-789",
    division: divisionName || "Division 1",
    date: "2025-04-15",
    amount: 4850,
    type: "Medical",
    status: "approved",
    description: "Annual physical examination and lab tests",
    provider: "City Medical Center",
    submissionDate: "2025-04-18",
    approvalDate: "2025-04-25"
  };

  const statusColors = {
    approved: "text-green-600",
    pending: "text-amber-600",
    denied: "text-red-600"
  };

  // Define the status icon mapping with proper typing
  const statusIcons = {
    approved: CheckCircle,
    pending: Clock,
    denied: XCircle
  };
  
  // Get the appropriate icon based on claim status
  const StatusIcon = statusIcons[claimDetails.status as keyof typeof statusIcons];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Claim Details
          </DialogTitle>
          <DialogDescription>
            Detailed information about claim {claimDetails.id}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <StatusIcon className={`h-4 w-4 ${statusColors[claimDetails.status as keyof typeof statusColors]}`} />
              <span className="capitalize">{claimDetails.status}</span>
            </div>
            <span className="text-lg font-bold">${claimDetails.amount.toLocaleString()}</span>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Employee:</span>
            </div>
            <div>{claimDetails.employeeName}</div>

            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Division:</span>
            </div>
            <div>{claimDetails.division}</div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Date:</span>
            </div>
            <div>{new Date(claimDetails.date).toLocaleDateString()}</div>

            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Type:</span>
            </div>
            <div>{claimDetails.type}</div>

            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Amount:</span>
            </div>
            <div>${claimDetails.amount.toLocaleString()}</div>
          </div>

          <Separator />

          <div>
            <h4 className="mb-2 font-medium">Description</h4>
            <p className="text-sm text-muted-foreground">{claimDetails.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-muted-foreground">Provider:</div>
            <div>{claimDetails.provider}</div>

            <div className="text-muted-foreground">Submitted:</div>
            <div>{new Date(claimDetails.submissionDate).toLocaleDateString()}</div>

            {claimDetails.status === "approved" && (
              <>
                <div className="text-muted-foreground">Approved:</div>
                <div>{new Date(claimDetails.approvalDate).toLocaleDateString()}</div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onClose}>Download PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
