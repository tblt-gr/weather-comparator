"use client";

import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const offsets = Array.from({ length: 10 }, (_, index) => index + 1);

type YearSelectorProps = {
  selectedOffsets: number[];
  onToggleOffset: (offsetYears: number) => void;
};

export function YearSelector({ selectedOffsets, onToggleOffset }: YearSelectorProps) {
  const count = selectedOffsets.length;
  const label =
    count === 0
      ? "Aucune période sélectionnée"
      : count === 1
        ? formatOffset(selectedOffsets[0])
        : `${count} périodes sélectionnées`;

  return (
    <div className="grid gap-1">
      <span className="text-sm font-medium">Périodes comparées</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Sélectionner les périodes à comparer"
            className="w-full justify-between"
            type="button"
            variant="outline"
          >
            <span className="truncate">{label}</span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {offsets.map((offsetYears) => {
            const checked = selectedOffsets.includes(offsetYears);
            return (
              <DropdownMenuCheckboxItem
                checked={checked}
                className="justify-between"
                key={offsetYears}
                onCheckedChange={() => onToggleOffset(offsetYears)}
              >
                <span className="flex items-center gap-2">
                  <Check className={checked ? "size-4 opacity-100" : "size-4 opacity-0"} />
                  {formatOffset(offsetYears)}
                </span>
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function formatOffset(offsetYears: number) {
  return offsetYears === 1 ? "-1 an" : `-${offsetYears} ans`;
}
