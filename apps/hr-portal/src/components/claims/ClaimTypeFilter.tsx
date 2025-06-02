"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const claimTypes = [
  { value: "all", label: "All Claims" },
  { value: "medical", label: "Medical" },
  { value: "dental", label: "Dental" },
  { value: "vision", label: "Vision" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "disability", label: "Disability" },
  { value: "life", label: "Life Insurance" },
] as const;

interface ClaimTypeFilterProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function ClaimTypeFilter({ value, onValueChange }: ClaimTypeFilterProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? claimTypes.find((type) => type.value === value)?.label
            : "Select claim type..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search claim type..." />
          <CommandEmpty>No claim type found.</CommandEmpty>
          <CommandGroup>
            {claimTypes.map((type) => (
              <CommandItem
                key={type.value}
                value={type.value}
                onSelect={(currentValue) => {
                  onValueChange(currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === type.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {type.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
