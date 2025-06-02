"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, BarChart2, BarChart3, BarChart4 } from "lucide-react";
import { Division } from "@/components/claims/drilldown/ClaimsDrilldown";

interface DivisionToggleProps {
  selectedDivision: Division;
  onDivisionChange: (division: Division) => void;
}

export function DivisionToggle({ 
  selectedDivision, 
  onDivisionChange 
}: DivisionToggleProps) {
  return (
    <div>
      <div className="my-4 text-sm text-muted-foreground">
        <p>Select a division to view its specific claims data or compare all divisions.</p>
      </div>      
      <Tabs 
        value={selectedDivision} 
        onValueChange={(value) => onDivisionChange(value as Division)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="All">Compare All</TabsTrigger>
          <TabsTrigger value="Division One">
            <BarChart className="mr-1 h-4 w-4" /> Division One
          </TabsTrigger>
          <TabsTrigger value="Division Two">
            <BarChart2 className="mr-1 h-4 w-4" /> Division Two
          </TabsTrigger>
          <TabsTrigger value="Division Three">
            <BarChart3 className="mr-1 h-4 w-4" /> Division Three
          </TabsTrigger>
        </TabsList>
      </Tabs>
    
    </div>
  );
}
