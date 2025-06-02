"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, Filter, ArrowDownAZ, ArrowUpAZ, ArrowUp, ArrowDown } from "lucide-react";
import { ClaimCategory, ClaimData, Division } from "./ClaimsDrilldown";

interface ClaimsTableProps {
  data: ClaimData[];
  selectedCategory: ClaimCategory;
  selectedDivision: Division;
  showCategoryColumn?: boolean; // Optional prop to control visibility of category column
  hideControls?: boolean; // Optional prop to hide the filter/export controls
}

// Define sort types for different table columns
type SortableColumn = "claimCount" | "totalAmount" | "percentOfCategory";
type SortDirection = "asc" | "desc";

export function ClaimsTable({ 
  data, 
  selectedCategory, 
  selectedDivision,
  showCategoryColumn = true, // Default to showing category column
  hideControls = false // Default to showing controls
}: ClaimsTableProps) {
  // State for sorting
  const [sortColumn, setSortColumn] = useState<SortableColumn>("totalAmount");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  
  // Handle sort change
  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking on same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Default to descending when switching columns
      setSortColumn(column);
      setSortDirection("desc");
    }
  };
  
  // Apply sorting
  const sortedData = [...data].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    return (a[sortColumn] - b[sortColumn]) * multiplier;
  });
  
  // Calculate the total amount of all claims in the current view
  const totalClaimedAmount = sortedData.reduce((sum, row) => sum + row.totalAmount, 0);
  
  // Helper function to render sort icon
  const renderSortIcon = (column: SortableColumn) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? <ArrowUp className="ml-1 h-3 w-3 inline" /> : <ArrowDown className="ml-1 h-3 w-3 inline" />;
  };

  return (
    <div>
      {!hideControls && (
        <div className="flex justify-end items-center mb-4">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Last 30 days</DropdownMenuItem>
                <DropdownMenuItem>Last 90 days</DropdownMenuItem>
                <DropdownMenuItem>Last 12 months</DropdownMenuItem>
                <DropdownMenuItem>All time</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {showCategoryColumn && <TableHead>Category</TableHead>}
              <TableHead>Treatment Type</TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort("claimCount")}>
                <div className="flex items-center justify-end">
                  # Paid Claims {renderSortIcon("claimCount")}
                </div>
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort("totalAmount")}>
                <div className="flex items-center justify-end">
                  Total $ Claimed {renderSortIcon("totalAmount")}
                </div>
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => handleSort("percentOfCategory")}>
                <div className="flex items-center justify-end">
                  % of Category {renderSortIcon("percentOfCategory")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showCategoryColumn ? 5 : 4} className="text-center py-4">
                  No claims data available for the selected criteria
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, index) => (
                <TableRow key={`${row.category}-${row.treatmentType}-${index}`}>
                  {showCategoryColumn && <TableCell>{row.category}</TableCell>}
                  <TableCell>{row.treatmentType}</TableCell>
                  <TableCell className="text-right">{row.claimCount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${row.totalAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{row.percentOfCategory}%</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow className="font-medium">
              <TableCell colSpan={showCategoryColumn ? 3 : 2} className="text-right">Total Claims Amount:</TableCell>
              <TableCell className="text-right font-bold">${totalClaimedAmount.toLocaleString()}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
