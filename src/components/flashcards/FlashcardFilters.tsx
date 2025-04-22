import * as React from "react";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface FlashcardFiltersProps {
  filters: {
    status: "pending" | "accepted" | "rejected" | null;
    method: "ai" | "manual" | null;
    sort: string | null;
  };
  onFilterChange: (newFilters: Partial<FlashcardFiltersProps["filters"]>) => void;
  onSortChange: (sortKey: string | null) => void;
}

const FlashcardFilters = ({
  filters,
  onFilterChange,
  onSortChange,
}: FlashcardFiltersProps) => {
  // Helper function to handle status change
  const handleStatusChange = (value: string) => {
    const status = value === "all" ? null : (value as "pending" | "accepted" | "rejected");
    onFilterChange({ status });
  };

  // Helper function to handle method change
  const handleMethodChange = (value: string) => {
    const method = value === "all" ? null : (value as "ai" | "manual");
    onFilterChange({ method });
  };

  // Helper function to handle sort change
  const handleSortChange = (value: string) => {
    const sort = value === "none" ? null : value;
    onSortChange(sort);
  };

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-end md:space-x-4 md:space-y-0">
      <div className="grid gap-2">
        <Label htmlFor="status-filter">Status</Label>
        <Select
          value={filters.status || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger id="status-filter" className="w-[180px]">
            <SelectValue placeholder="Wszystkie statusy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie statusy</SelectItem>
            <SelectItem value="pending">Oczekujące</SelectItem>
            <SelectItem value="accepted">Zaakceptowane</SelectItem>
            <SelectItem value="rejected">Odrzucone</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="method-filter">Metoda</Label>
        <Select
          value={filters.method || "all"}
          onValueChange={handleMethodChange}
        >
          <SelectTrigger id="method-filter" className="w-[180px]">
            <SelectValue placeholder="Wszystkie metody" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie metody</SelectItem>
            <SelectItem value="ai">AI</SelectItem>
            <SelectItem value="manual">Ręcznie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="sort-filter">Sortowanie</Label>
        <Select
          value={filters.sort || "none"}
          onValueChange={handleSortChange}
        >
          <SelectTrigger id="sort-filter" className="w-[180px]">
            <SelectValue placeholder="Domyślne sortowanie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Domyślne sortowanie</SelectItem>
            <SelectItem value="createdAt">Data utworzenia (od najnowszych)</SelectItem>
            <SelectItem value="-createdAt">Data utworzenia (od najstarszych)</SelectItem>
            <SelectItem value="front">Przód (A-Z)</SelectItem>
            <SelectItem value="-front">Przód (Z-A)</SelectItem>
            <SelectItem value="status">Status (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FlashcardFilters; 