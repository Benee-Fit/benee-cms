import React from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@repo/design-system/components/ui/collapsible';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@repo/design-system/lib/utils';

interface CoverageSidebarProps {
  coverageCategories: Record<string, string[]>;
  activeCoverage: string | null;
  onCoverageSelect: (coverageType: string) => void;
}

const CoverageSidebar: React.FC<CoverageSidebarProps> = ({
  coverageCategories,
  activeCoverage,
  onCoverageSelect,
}) => {
  // Track expanded state of each category
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>(
    Object.keys(coverageCategories).reduce((acc, category) => {
      acc[category] = true;
      return acc;
    }, {} as Record<string, boolean>)
  );

  // Toggle category expanded/collapsed state
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="bg-background rounded-lg border shadow-sm">
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium">Coverage Types</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Select a coverage to filter
        </p>
      </div>

      <div className="p-2">
        {Object.entries(coverageCategories || {}).map(([category, coverageTypes]) => (
          <Collapsible 
            key={category} 
            open={expandedCategories[category]}
            className="mb-2"
          >
            <CollapsibleTrigger 
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center justify-between p-2 hover:bg-accent rounded-md"
            >
              <span className="font-medium">{category}</span>
              {expandedCategories[category] ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pl-2">
              <div className="space-y-1 mt-1">
                {(() => {
                  // Highly defensive code to ensure we only render strings
                  if (!Array.isArray(coverageTypes)) {
                    return (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        No valid coverage types (not an array)
                      </div>
                    );
                  }

                  // Filter to only include valid strings
                  const validCoverageTypes = coverageTypes.filter(
                    type => typeof type === 'string'
                  );

                  if (validCoverageTypes.length === 0) {
                    return (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        No valid coverage types (empty array or no strings)
                      </div>
                    );
                  }

                  // Render valid string coverage types
                  return validCoverageTypes.map(coverageType => {
                    // Extra safety check
                    if (typeof coverageType !== 'string') {
                      // Remove console.error and handle gracefully
                      return null;
                    }

                    return (
                      <Button
                        key={coverageType}
                        variant={activeCoverage === coverageType ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start text-sm",
                          activeCoverage === coverageType && "bg-secondary"
                        )}
                        onClick={() => onCoverageSelect(coverageType)}
                      >
                        <span className="truncate">{coverageType}</span>
                      </Button>
                    );
                  });
                })()}
                
                {Array.isArray(coverageTypes) && coverageTypes.length === 0 && (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    No coverage types available
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

export default CoverageSidebar;
