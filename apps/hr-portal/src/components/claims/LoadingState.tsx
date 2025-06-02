"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  type: "chart" | "metrics" | "full-page";
}

export function LoadingState({ type }: LoadingStateProps) {
  if (type === "full-page") {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] w-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading claims data...</p>
      </div>
    );
  }

  if (type === "metrics") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-8 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Chart loading state
  return (
    <div className="flex flex-col space-y-3 p-4">
      <Skeleton className="h-8 w-[200px]" />
      <Skeleton className="h-[250px] w-full rounded-md" />
    </div>
  );
}
