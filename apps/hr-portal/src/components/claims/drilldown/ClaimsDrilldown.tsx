"use client";

import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Home, Pill, Stethoscope, Smile, Eye, Shield, Filter, Download } from "lucide-react";
import { ClaimCategoryChart } from "@/components/claims/drilldown/ClaimCategoryChart";
import { ClaimsTable } from "@/components/claims/drilldown/ClaimsTable";
import { DivisionToggle } from "@/components/claims/drilldown/DivisionToggle";

// Define the claim categories
export type ClaimCategory = "Overall" | "Drugs" | "Para" | "Dental" | "Vision" | "Insurance";

// Define the divisions
export type Division = "Division One" | "Division Two" | "Division Three" | "All";

// Sample data structure for claims
export interface ClaimData {
  category: ClaimCategory;
  treatmentType: string;
  claimCount: number;
  totalAmount: number;
  percentOfCategory: number;
}

interface ClaimsDrilldownProps {
  selectedDivision?: string | null;
}

export function ClaimsDrilldown({ selectedDivision: initialDivision }: ClaimsDrilldownProps = {}) {
  // State for selected category and division
  const [selectedCategory, setSelectedCategory] = useState<ClaimCategory>("Overall");
  const [selectedDivision, setSelectedDivision] = useState<Division>(
    initialDivision as Division || "All"
  );
  const [topClaimCategory, setTopClaimCategory] = useState<ClaimCategory | null>(null);
  
  // Update selected division when prop changes
  useEffect(() => {
    if (initialDivision) {
      setSelectedDivision(initialDivision as Division);
    }
  }, [initialDivision]);

  // Sample data for main categories by division (would come from API in real implementation)
  const allDivisionsData = {
    "All": [
      { category: "Drugs", amount: 25000, claimCount: 150, percentage: 30 },
      { category: "Para", amount: 18000, claimCount: 120, percentage: 22 },
      { category: "Dental", amount: 15000, claimCount: 90, percentage: 18 },
      { category: "Vision", amount: 10000, claimCount: 60, percentage: 12 },
      { category: "Insurance", amount: 15000, claimCount: 30, percentage: 18 },
    ],
    "Division One": [
      { category: "Drugs", amount: 12000, claimCount: 70, percentage: 35 },
      { category: "Para", amount: 8000, claimCount: 50, percentage: 24 },
      { category: "Dental", amount: 6000, claimCount: 40, percentage: 18 },
      { category: "Vision", amount: 4000, claimCount: 25, percentage: 12 },
      { category: "Insurance", amount: 4000, claimCount: 10, percentage: 11 },
    ],
    "Division Two": [
      { category: "Drugs", amount: 8000, claimCount: 50, percentage: 28 },
      { category: "Para", amount: 6000, claimCount: 40, percentage: 21 },
      { category: "Dental", amount: 5000, claimCount: 30, percentage: 17 },
      { category: "Vision", amount: 4000, claimCount: 20, percentage: 14 },
      { category: "Insurance", amount: 6000, claimCount: 12, percentage: 20 },
    ],
    "Division Three": [
      { category: "Drugs", amount: 5000, claimCount: 30, percentage: 25 },
      { category: "Para", amount: 4000, claimCount: 30, percentage: 20 },
      { category: "Dental", amount: 4000, claimCount: 20, percentage: 20 },
      { category: "Vision", amount: 2000, claimCount: 15, percentage: 10 },
      { category: "Insurance", amount: 5000, claimCount: 8, percentage: 25 },
    ],
  };
  
  // Get data for the current division
  const mainCategoryData = allDivisionsData[selectedDivision] || allDivisionsData["All"];
  
  // Sample subcategory data - organized by main category and division
  const allSubcategoryData = {
    "All": {
      Drugs: [
        { category: "Prescription Drugs", amount: 15000, claimCount: 100, percentage: 60 },
        { category: "Over-the-Counter", amount: 6000, claimCount: 35, percentage: 24 },
        { category: "Specialty Drugs", amount: 4000, claimCount: 15, percentage: 16 }
      ],
      Para: [
        { category: "Physiotherapy", amount: 7000, claimCount: 50, percentage: 39 },
        { category: "Chiropractic", amount: 6000, claimCount: 40, percentage: 33 },
        { category: "Massage Therapy", amount: 5000, claimCount: 30, percentage: 28 }
      ],
      Dental: [
        { category: "Basic Dental", amount: 6000, claimCount: 45, percentage: 40 },
        { category: "Major Dental", amount: 5000, claimCount: 25, percentage: 33 },
        { category: "Orthodontic", amount: 4000, claimCount: 20, percentage: 27 }
      ],
      Vision: [
        { category: "Eyeglasses", amount: 5000, claimCount: 30, percentage: 50 },
        { category: "Contact Lenses", amount: 3000, claimCount: 20, percentage: 30 },
        { category: "Eye Exams", amount: 2000, claimCount: 10, percentage: 20 }
      ],
      Insurance: [
        { category: "Life Insurance", amount: 7000, claimCount: 10, percentage: 47 },
        { category: "Critical Illness", amount: 5000, claimCount: 5, percentage: 33 },
        { category: "Disability", amount: 3000, claimCount: 15, percentage: 20 }
      ]
    },
    "Division One": {
      Drugs: [
        { category: "Prescription Drugs", amount: 8000, claimCount: 45, percentage: 67 },
        { category: "Over-the-Counter", amount: 2500, claimCount: 20, percentage: 21 },
        { category: "Specialty Drugs", amount: 1500, claimCount: 5, percentage: 12 }
      ],
      Para: [
        { category: "Physiotherapy", amount: 3500, claimCount: 25, percentage: 44 },
        { category: "Chiropractic", amount: 2500, claimCount: 15, percentage: 31 },
        { category: "Massage Therapy", amount: 2000, claimCount: 10, percentage: 25 }
      ],
      Dental: [
        { category: "Basic Dental", amount: 2500, claimCount: 20, percentage: 42 },
        { category: "Major Dental", amount: 2000, claimCount: 12, percentage: 33 },
        { category: "Orthodontic", amount: 1500, claimCount: 8, percentage: 25 }
      ],
      Vision: [
        { category: "Eyeglasses", amount: 2000, claimCount: 12, percentage: 50 },
        { category: "Contact Lenses", amount: 1200, claimCount: 8, percentage: 30 },
        { category: "Eye Exams", amount: 800, claimCount: 5, percentage: 20 }
      ],
      Insurance: [
        { category: "Life Insurance", amount: 2000, claimCount: 3, percentage: 50 },
        { category: "Critical Illness", amount: 1200, claimCount: 2, percentage: 30 },
        { category: "Disability", amount: 800, claimCount: 5, percentage: 20 }
      ]
    },
    "Division Two": {
      Drugs: [
        { category: "Prescription Drugs", amount: 4500, claimCount: 35, percentage: 56 },
        { category: "Over-the-Counter", amount: 2000, claimCount: 10, percentage: 25 },
        { category: "Specialty Drugs", amount: 1500, claimCount: 5, percentage: 19 }
      ],
      Para: [
        { category: "Physiotherapy", amount: 2500, claimCount: 18, percentage: 42 },
        { category: "Chiropractic", amount: 2000, claimCount: 15, percentage: 33 },
        { category: "Massage Therapy", amount: 1500, claimCount: 7, percentage: 25 }
      ],
      Dental: [
        { category: "Basic Dental", amount: 2000, claimCount: 15, percentage: 40 },
        { category: "Major Dental", amount: 1800, claimCount: 10, percentage: 36 },
        { category: "Orthodontic", amount: 1200, claimCount: 5, percentage: 24 }
      ],
      Vision: [
        { category: "Eyeglasses", amount: 2000, claimCount: 10, percentage: 50 },
        { category: "Contact Lenses", amount: 1200, claimCount: 7, percentage: 30 },
        { category: "Eye Exams", amount: 800, claimCount: 3, percentage: 20 }
      ],
      Insurance: [
        { category: "Life Insurance", amount: 3000, claimCount: 5, percentage: 50 },
        { category: "Critical Illness", amount: 1800, claimCount: 3, percentage: 30 },
        { category: "Disability", amount: 1200, claimCount: 4, percentage: 20 }
      ]
    },
    "Division Three": {
      Drugs: [
        { category: "Prescription Drugs", amount: 2500, claimCount: 18, percentage: 50 },
        { category: "Over-the-Counter", amount: 1500, claimCount: 8, percentage: 30 },
        { category: "Specialty Drugs", amount: 1000, claimCount: 4, percentage: 20 }
      ],
      Para: [
        { category: "Physiotherapy", amount: 1500, claimCount: 12, percentage: 38 },
        { category: "Chiropractic", amount: 1500, claimCount: 10, percentage: 38 },
        { category: "Massage Therapy", amount: 1000, claimCount: 8, percentage: 24 }
      ],
      Dental: [
        { category: "Basic Dental", amount: 1600, claimCount: 10, percentage: 40 },
        { category: "Major Dental", amount: 1400, claimCount: 6, percentage: 35 },
        { category: "Orthodontic", amount: 1000, claimCount: 4, percentage: 25 }
      ],
      Vision: [
        { category: "Eyeglasses", amount: 1000, claimCount: 8, percentage: 50 },
        { category: "Contact Lenses", amount: 600, claimCount: 5, percentage: 30 },
        { category: "Eye Exams", amount: 400, claimCount: 2, percentage: 20 }
      ],
      Insurance: [
        { category: "Life Insurance", amount: 2500, claimCount: 3, percentage: 50 },
        { category: "Critical Illness", amount: 1500, claimCount: 2, percentage: 30 },
        { category: "Disability", amount: 1000, claimCount: 3, percentage: 20 }
      ]
    }
  };
  
  // Get subcategory data for the current division
  const subcategoryData = allSubcategoryData[selectedDivision] || allSubcategoryData["All"];
  
  // Determine which data to use based on the selected category
  const chartData = selectedCategory === "Overall" 
    ? mainCategoryData 
    : subcategoryData[selectedCategory] || [];

  // Create claims table data from the subcategory data
  const generateClaimsData = (subcategoryData: any): ClaimData[] => {
    const result: ClaimData[] = [];
    
    // Loop through each category in the subcategory data
    Object.keys(subcategoryData).forEach(category => {
      // Loop through each subcategory item
      subcategoryData[category].forEach((item: any) => {
        // Add to the claims data array
        result.push({
          category: category as ClaimCategory,
          treatmentType: item.category,
          claimCount: item.claimCount,
          totalAmount: item.amount,
          percentOfCategory: item.percentage
        });
      });
    });
    
    return result;
  };
  
  // Generate claims data for the current division
  const claimsData: ClaimData[] = generateClaimsData(subcategoryData);

  // Filter claims data based on selected category and create data for table
  const filteredClaimsData = selectedCategory === "Overall" 
    ? claimsData
    : claimsData.filter(claim => claim.category === selectedCategory);

  // Define category items with icons and labels
  const categoryItems = [
    { id: "Overall", icon: Home, label: "Overview" },
    { id: "Drugs", icon: Pill, label: "Drugs" },
    { id: "Para", icon: Stethoscope, label: "Para" },
    { id: "Dental", icon: Smile, label: "Dental" },
    { id: "Vision", icon: Eye, label: "Vision" },
    { id: "Insurance", icon: Shield, label: "Insurance" }
  ];

  // Handle dropdown selection change
  const handleCategoryDropdownChange = (value: string) => {
    // Set both the top dropdown and the main category selection
    setTopClaimCategory(value as ClaimCategory);
    setSelectedCategory(value as ClaimCategory);
  };

  // No longer needed as we're using just the dropdown
  // const handleNavChange = (category: ClaimCategory) => {
  //   setSelectedCategory(category);
  // };

  // Handle division toggle change
  const handleDivisionChange = (division: Division) => {
    setSelectedDivision(division);
  };

  return (
    <div className="space-y-6">
        {/* Top section with category dropdown */}
        <div className="flex justify-start gap-5 items-center mb-4">
          <Select 
            value={selectedCategory} 
            onValueChange={handleCategoryDropdownChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {categoryItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center">
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/*
          <Button variant="outline" size="sm">
            Export Data
          </Button>
          */}
          <div className="my-4 text-sm text-muted-foreground align-left">
            <p>Select a category to view its specific claims data or compare all categories.</p>
          </div>   
        </div>

        {/* Division Comparison Toggle */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Compare Across Divisions</h3>
          <DivisionToggle 
            selectedDivision={selectedDivision}
            onDivisionChange={handleDivisionChange}
          />
        </Card>        

        {/* Claims Distribution Chart */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Claim Distribution by Category</h3>
          <ClaimCategoryChart 
            data={chartData}
            selectedCategory={selectedCategory}
            selectedDivision={selectedDivision}
            onCategorySelect={setSelectedCategory}
          />
        </Card>

        {/* Claims Tables - Shown based on selected category */}
        {selectedCategory === "Overall" ? (
          // In Overview mode, show separate tables for each category
          <div className="space-y-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-6">Claims Breakdown by Category</h3>
              
              {/* Show a separate table for each category */}
              {Object.keys(subcategoryData).map((category) => {
                const categoryData = claimsData.filter(claim => claim.category === category);
                return categoryData.length > 0 ? (
                  <div key={category} className="mb-10 last:mb-0">
                    {/* Category heading and controls in one row */}
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium" id={`${category.toLowerCase()}-claims-heading`}>
                        {category} Claims
                      </h4>
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
                    <ClaimsTable
                      data={categoryData} 
                      selectedCategory={category as ClaimCategory}
                      selectedDivision={selectedDivision}
                      showCategoryColumn={false} // Hide category column since we have a header
                      hideControls={true} // Hide the controls since we moved them up
                    />
                  </div>
                ) : null;
              })}
            </Card>
          </div>
        ) : (
          // When a specific category is selected, show only that category's table
          <Card className="p-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold" id="claims-breakdown-heading">
                {selectedCategory} Claims Breakdown
              </h3>
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
            <ClaimsTable
              data={filteredClaimsData} 
              selectedCategory={selectedCategory}
              selectedDivision={selectedDivision}
              showCategoryColumn={false} // Hide category column as it's redundant
              hideControls={true} // Hide controls since we moved them up
            />
          </Card>
        )}
    </div>
  );
}
