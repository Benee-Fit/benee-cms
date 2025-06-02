"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Pill, Stethoscope, Smile, Eye, Shield } from "lucide-react";
import { ClaimCategory } from "@/components/claims/drilldown/ClaimsDrilldown";

interface SideNavigationProps {
  selectedCategory: ClaimCategory;
  onCategoryChange: (category: ClaimCategory) => void;
}

export function SideNavigation({ selectedCategory, onCategoryChange }: SideNavigationProps) {
  // Define navigation items with icons and labels
  const navItems = [
    { id: "Overall", icon: Home, label: "Overview" },
    { id: "Drugs", icon: Pill, label: "Drugs" },
    { id: "Para", icon: Stethoscope, label: "Para" },
    { id: "Dental", icon: Smile, label: "Dental" },
    { id: "Vision", icon: Eye, label: "Vision" },
    { id: "Insurance", icon: Shield, label: "Insurance" }
  ];

  return (
    <Card className="p-4 h-full">
      <div className="space-y-2">
        <h3 className="font-semibold mb-4">Categories</h3>
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={selectedCategory === item.id ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => onCategoryChange(item.id as ClaimCategory)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            <span>{item.label}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
}
