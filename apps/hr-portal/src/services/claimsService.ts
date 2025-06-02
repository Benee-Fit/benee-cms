"use client";

import { DateRange } from "react-day-picker";

// Types for our claims data
export interface Claim {
  id: string;
  amount: number;
  date: string;
  type: string;
  division: string;
  employeeId: string;
  status: "pending" | "approved" | "denied";
}

export interface ClaimsSummary {
  totalPremium: number;
  totalClaim: number;
  targetLossRatio: number;
  highestClaim: number;
  highestClaimType: string;
  premiumUsagePercentage: number;
}

export interface MonthlyClaimsData {
  name: string;
  premiums: number;
  claims: number;
}

export interface DivisionClaimsData {
  name: string;
  premiums: number;
  claims: number;
}

export interface PremiumByDivisionData {
  name: string;
  value: number;
}

// Define claim type multipliers to avoid TypeScript errors
const claimTypeMultipliers = {
  medical: 0.6,
  dental: 0.15,
  vision: 0.05,
  pharmacy: 0.1,
  disability: 0.05,
  life: 0.05
};

type ClaimTypeKey = keyof typeof claimTypeMultipliers;

// Mock data generator functions
const generateMockMonthlyData = (
  filter: string,
  dateRange?: DateRange,
  claimType: string = "all"
): MonthlyClaimsData[] => {
  // In a real app, this would fetch from an API based on the filters
  const baseData = [
    { name: "Jan", premiums: 4000, claims: 2400 },
    { name: "Feb", premiums: 3000, claims: 1398 },
    { name: "Mar", premiums: 2000, claims: 9800 },
    { name: "Apr", premiums: 2780, claims: 3908 },
    { name: "May", premiums: 1890, claims: 4800 },
    { name: "Jun", premiums: 2390, claims: 3800 },
    { name: "Jul", premiums: 3490, claims: 4300 },
    { name: "Aug", premiums: 3490, claims: 4300 },
    { name: "Sep", premiums: 3490, claims: 4300 },
    { name: "Oct", premiums: 3490, claims: 4300 },
    { name: "Nov", premiums: 3490, claims: 4300 },
    { name: "Dec", premiums: 3490, claims: 4300 },
  ];

  // Apply filter variations to simulate different data sets
  if (filter === "custom" && dateRange?.from) {
    // Filter to only show months in the date range
    const fromMonth = new Date(dateRange.from).getMonth();
    const toMonth = dateRange.to 
      ? new Date(dateRange.to).getMonth() 
      : fromMonth;
    
    return baseData.filter((_, index) => 
      index >= fromMonth && index <= toMonth
    );
  }
  
  if (filter === "inception") {
    // Simulate different data for since inception view
    return baseData.map(item => ({
      ...item,
      premiums: item.premiums * 1.5,
      claims: item.claims * 1.4
    }));
  }

  if (claimType !== "all") {
    // Simulate filtering by claim type
    const multiplier = Object.keys(claimTypeMultipliers).includes(claimType)
      ? claimTypeMultipliers[claimType as ClaimTypeKey]
      : 1;
    
    return baseData.map(item => ({
      ...item,
      claims: Math.round(item.claims * multiplier)
    }));
  }

  return baseData;
};

const generateMockDivisionData = (
  filter: string,
  claimType: string = "all"
): DivisionClaimsData[] => {
  const baseData = [
    { name: "Division 1", premiums: 4000, claims: 2400 },
    { name: "Division 2", premiums: 3000, claims: 1398 },
    { name: "Division 3", premiums: 2000, claims: 3800 },
  ];

  if (claimType !== "all") {
    // Simulate filtering by claim type
    const multiplier = Object.keys(claimTypeMultipliers).includes(claimType)
      ? claimTypeMultipliers[claimType as ClaimTypeKey]
      : 1;
    
    return baseData.map(item => ({
      ...item,
      claims: Math.round(item.claims * multiplier)
    }));
  }

  if (filter === "inception") {
    return baseData.map(item => ({
      ...item,
      premiums: item.premiums * 1.5,
      claims: item.claims * 1.4
    }));
  }

  return baseData;
};

const generateMockPremiumByDivisionData = (
  filter: string
): PremiumByDivisionData[] => {
  const baseData = [
    { name: "Division 1", value: 4000 },
    { name: "Division 2", value: 3000 },
    { name: "Division 3", value: 2000 },
  ];

  if (filter === "inception") {
    return baseData.map(item => ({
      ...item,
      value: item.value * 1.5
    }));
  }

  return baseData;
};

const generateMockSummary = (
  filter: string,
  claimType: string = "all"
): ClaimsSummary => {
  let baseData = {
    totalPremium: 1245000,
    totalClaim: 567890,
    targetLossRatio: 45.6,
    highestClaim: 98765,
    highestClaimType: "Medical",
    premiumUsagePercentage: 45
  };

  if (claimType !== "all") {
    // Simulate filtering by claim type
    const multiplier = Object.keys(claimTypeMultipliers).includes(claimType)
      ? claimTypeMultipliers[claimType as ClaimTypeKey]
      : 1;
    
    // When filtering by a specific claim type, that becomes the highest claim type
    const claimTypeLabels: Record<string, string> = {
      medical: "Medical",
      dental: "Dental",
      vision: "Vision",
      pharmacy: "Pharmacy",
      disability: "Disability",
      life: "Life Insurance"
    };
    
    return {
      ...baseData,
      totalClaim: Math.round(baseData.totalClaim * multiplier),
      highestClaim: Math.round(baseData.highestClaim * multiplier),
      highestClaimType: claimTypeLabels[claimType as keyof typeof claimTypeLabels] || "Unknown",
      targetLossRatio: +(baseData.targetLossRatio * multiplier).toFixed(1),
      premiumUsagePercentage: Math.round(baseData.premiumUsagePercentage * multiplier)
    };
  }

  if (filter === "inception") {
    return {
      ...baseData,
      totalPremium: Math.round(baseData.totalPremium * 1.5),
      totalClaim: Math.round(baseData.totalClaim * 1.4),
      highestClaim: Math.round(baseData.highestClaim * 1.3),
      highestClaimType: "Hospital",  // Different highest claim type for inception view
      targetLossRatio: 56.2,
      premiumUsagePercentage: 65
    };
  }

  return baseData;
};

// Simulate API calls with delay and potential errors
const simulateApiCall = <T>(data: T, errorRate = 0.0): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < errorRate) {
        reject(new Error("Failed to fetch data. Please try again."));
      } else {
        resolve(data);
      }
    }, 800 + Math.random() * 800); // Random delay between 800-1600ms
  });
};

// Service functions that would normally call APIs
export const fetchMonthlyClaimsData = async (
  filter: string,
  dateRange?: DateRange,
  claimType: string = "all"
): Promise<MonthlyClaimsData[]> => {
  const data = generateMockMonthlyData(filter, dateRange, claimType);
  return simulateApiCall(data);
};

export const fetchDivisionClaimsData = async (
  filter: string,
  claimType: string = "all"
): Promise<DivisionClaimsData[]> => {
  const data = generateMockDivisionData(filter, claimType);
  return simulateApiCall(data);
};

export const fetchPremiumByDivisionData = async (
  filter: string
): Promise<PremiumByDivisionData[]> => {
  const data = generateMockPremiumByDivisionData(filter);
  return simulateApiCall(data);
};

export const fetchClaimsSummary = async (
  filter: string,
  claimType: string = "all"
): Promise<ClaimsSummary> => {
  const data = generateMockSummary(filter, claimType);
  return simulateApiCall(data);
};

// Export function for CSV data
export const generateCsvData = (
  monthlyData: MonthlyClaimsData[],
  divisionData: DivisionClaimsData[],
  summary: ClaimsSummary
): string => {
  // Generate CSV for monthly data
  let csv = "Monthly Data\n";
  csv += "Month,Premiums,Claims\n";
  monthlyData.forEach(item => {
    csv += `${item.name},${item.premiums},${item.claims}\n`;
  });
  
  // Add division data
  csv += "\nDivision Data\n";
  csv += "Division,Premiums,Claims\n";
  divisionData.forEach(item => {
    csv += `${item.name},${item.premiums},${item.claims}\n`;
  });
  
  // Add summary
  csv += "\nSummary\n";
  csv += `Total Premium,${summary.totalPremium}\n`;
  csv += `Total Claim,${summary.totalClaim}\n`;
  csv += `Target Loss Ratio,${summary.targetLossRatio}%\n`;
  csv += `Highest Claim,${summary.highestClaim}\n`;
  csv += `Premium Usage,${summary.premiumUsagePercentage}%\n`;
  
  return csv;
};

// Function to download CSV
export const downloadCsv = (data: string, filename: string): void => {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Mock function for PDF export (in a real app, would use a library like jsPDF)
export const downloadPdf = (filename: string): void => {
  alert("PDF export would be implemented with a library like jsPDF in a production environment.");
  // In a real implementation:
  // 1. Create PDF document
  // 2. Add charts as images
  // 3. Add tables with data
  // 4. Save and download
};
