"use client";

import { useState, useEffect, useCallback } from "react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, AlertCircle, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import custom components
import { DateRangePicker } from "@/components/claims/DateRangePicker";
import { ClaimTypeFilter } from "@/components/claims/ClaimTypeFilter";
import { ExportOptions } from "@/components/claims/ExportOptions";
import { LoadingState } from "@/components/claims/LoadingState";
import { ErrorState } from "@/components/claims/ErrorState";
import { MonthlyClaimsChart } from "@/components/claims/MonthlyClaimsChart";
import { MetricsSection } from "@/components/claims/MetricsSection";
import { DivisionCharts } from "@/components/claims/DivisionCharts";
import { ClaimsDrilldown } from "@/components/claims/drilldown/ClaimsDrilldown";

// Import services
import {
  fetchMonthlyClaimsData,
  fetchDivisionClaimsData,
  fetchPremiumByDivisionData,
  fetchClaimsSummary,
  generateCsvData,
  downloadCsv,
  downloadPdf,
  MonthlyClaimsData,
  DivisionClaimsData,
  PremiumByDivisionData,
  ClaimsSummary
} from "@/services/claimsService";

export default function ClaimsOverviewPage() {
  // State for filters
  const [filterTab, setFilterTab] = useState("renewal");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [claimType, setClaimType] = useState("all");
  
  // State for toggling between overview and drilldown view
  const [showDrilldown, setShowDrilldown] = useState(false);
  // State for selected division when navigating to drilldown
  const [selectedDrilldownDivision, setSelectedDrilldownDivision] = useState<string | null>(null);
  
  // Handle toggling to drilldown view
  const handleDrilldownToggle = () => {
    setShowDrilldown(!showDrilldown);
    // Reset selected division when toggling back to overview
    if (showDrilldown) {
      setSelectedDrilldownDivision(null);
    }
  };
  
  // Handle division selection from charts to navigate to drilldown
  const handleDivisionSelect = (division: string) => {
    setSelectedDrilldownDivision(division);
    setShowDrilldown(true);
    
    // Scroll back to top of the page when navigating from overview to drilldown
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // State for data
  const [monthlyData, setMonthlyData] = useState<MonthlyClaimsData[]>([]);
  const [divisionData, setDivisionData] = useState<DivisionClaimsData[]>([]);
  const [premiumByDivisionData, setPremiumByDivisionData] = useState<PremiumByDivisionData[]>([]);
  const [summaryData, setSummaryData] = useState<ClaimsSummary | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    monthly: true,
    division: true,
    premiumByDivision: true,
    summary: true
  });
  const [errors, setErrors] = useState({
    monthly: null as Error | null,
    division: null as Error | null,
    premiumByDivision: null as Error | null,
    summary: null as Error | null
  });

  // Function to load all data
  const loadAllData = useCallback(async () => {
    setLoading({
      monthly: true,
      division: true,
      premiumByDivision: true,
      summary: true
    });
    setErrors({
      monthly: null,
      division: null,
      premiumByDivision: null,
      summary: null
    });

    try {
      const monthlyResult = await fetchMonthlyClaimsData(filterTab, dateRange, claimType);
      setMonthlyData(monthlyResult);
      setLoading(prev => ({ ...prev, monthly: false }));
    } catch (error) {
      setErrors(prev => ({ ...prev, monthly: error as Error }));
      setLoading(prev => ({ ...prev, monthly: false }));
    }

    try {
      const divisionResult = await fetchDivisionClaimsData(filterTab, claimType);
      setDivisionData(divisionResult);
      setLoading(prev => ({ ...prev, division: false }));
    } catch (error) {
      setErrors(prev => ({ ...prev, division: error as Error }));
      setLoading(prev => ({ ...prev, division: false }));
    }

    try {
      const premiumByDivisionResult = await fetchPremiumByDivisionData(filterTab);
      setPremiumByDivisionData(premiumByDivisionResult);
      setLoading(prev => ({ ...prev, premiumByDivision: false }));
    } catch (error) {
      setErrors(prev => ({ ...prev, premiumByDivision: error as Error }));
      setLoading(prev => ({ ...prev, premiumByDivision: false }));
    }

    try {
      const summaryResult = await fetchClaimsSummary(filterTab, claimType);
      setSummaryData(summaryResult);
      setLoading(prev => ({ ...prev, summary: false }));
    } catch (error) {
      setErrors(prev => ({ ...prev, summary: error as Error }));
      setLoading(prev => ({ ...prev, summary: false }));
    }
  }, [filterTab, dateRange, claimType]);

  // Load data on initial render and when filters change
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handle export
  const handleExport = (format: "csv" | "pdf") => {
    if (format === "csv" && !loading.monthly && !loading.division && !loading.summary && summaryData) {
      const csvData = generateCsvData(monthlyData, divisionData, summaryData);
      downloadCsv(csvData, `claims-overview-${new Date().toISOString().split('T')[0]}.csv`);
    } else if (format === "pdf") {
      downloadPdf(`claims-overview-${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  // Check if all data is loading
  const isAllLoading = loading.monthly && loading.division && loading.premiumByDivision && loading.summary;

  // Check if there are any errors
  const hasAnyError = errors.monthly || errors.division || errors.premiumByDivision || errors.summary;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header with Title and Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-primary">{showDrilldown ? "Claims Drilldown" : "Claims Overview"}</h1>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <Button 
            variant={showDrilldown ? "secondary" : "default"}
            onClick={() => setShowDrilldown(!showDrilldown)}
            className=""
          >
            {showDrilldown ? "Back to Overview" : "Claims Drilldown"}
          </Button>          
          
          {/* Only show filter elements when not in drilldown view */}
          {!showDrilldown && (
            <>
              <Tabs 
                defaultValue="renewal" 
                value={filterTab} 
                onValueChange={setFilterTab} 
                className="w-full sm:w-auto"
              >
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="renewal">Since Renewal</TabsTrigger>
                  <TabsTrigger value="inception">Since Inception</TabsTrigger>
                  <TabsTrigger value="custom">Custom Date Range</TabsTrigger>
                </TabsList>
                
                {filterTab === "custom" && (
                  <TabsContent value="custom" className="mt-2">
                    <DateRangePicker 
                      dateRange={dateRange} 
                      onDateRangeChange={setDateRange} 
                      className="w-full sm:w-[300px]"
                    />
                  </TabsContent>
                )}
              </Tabs>
              
              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <ClaimTypeFilter 
                  value={claimType} 
                  onValueChange={setClaimType} 
                />
                
                {/*<ExportOptions onExport={handleExport} />*/}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Full page loading state */}
      
      {/* Conditional rendering based on view */}
      {showDrilldown ? (
        <ClaimsDrilldown selectedDivision={selectedDrilldownDivision} />
      ) : (
        <>
          {isAllLoading && <LoadingState type="full-page" />}

          {/* Global error state */}
          {hasAnyError && errors.monthly && errors.division && errors.summary && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                There was an error loading the claims data. Please try again later.
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadAllData} 
                  className="ml-2"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Content area - only show if not in full-page loading state */}
          {!isAllLoading && (
            <>
              {/* Monthly Chart */}
              <MonthlyClaimsChart 
                data={monthlyData}
                isLoading={loading.monthly}
                error={errors.monthly}
                onRetry={loadAllData}
                onChartClick={() => {
                  // When clicking on Monthly Claims chart, reset division selection to "All"
                  setSelectedDrilldownDivision("All");
                  setShowDrilldown(true);
                  // Scroll back to top of the page when navigating to drilldown
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  });
                }}
              />

              {/* Metrics Section */}
              {summaryData && (
                <MetricsSection 
                  data={summaryData}
                  isLoading={loading.summary}
                  error={errors.summary}
                  onRetry={loadAllData}
                />
              )}

              {/* Division Charts */}
              {summaryData && (
                <DivisionCharts 
                  divisionData={divisionData}
                  premiumByDivisionData={premiumByDivisionData}
                  summary={summaryData}
                  isLoading={loading.division || loading.premiumByDivision}
                  error={errors.division || errors.premiumByDivision}
                  onRetry={loadAllData}
                  onDivisionSelect={handleDivisionSelect}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
