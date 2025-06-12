'use client';

import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/design-system/components/ui/tooltip';

interface LossReasonTooltipProps {
  reason: string;
}

export function LossReasonTooltip({ reason }: LossReasonTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="ml-1 text-muted-foreground hover:text-foreground">
            <HelpCircle className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}