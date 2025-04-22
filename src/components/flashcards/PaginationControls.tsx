import * as React from "react";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  pagination: {
    currentPage: number;
    totalPages: number;
    limit: number;
    totalItems: number;
  };
  onPageChange: (newPage: number) => void;
}

const PaginationControls = ({
  pagination,
  onPageChange,
}: PaginationControlsProps) => {
  const { currentPage, totalPages, totalItems } = pagination;
  
  // Calculate the start and end item numbers for current page
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pagination.limit + 1;
  const endItem = Math.min(currentPage * pagination.limit, totalItems);

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-muted-foreground">
        {totalItems > 0 ? (
          <>
            Pokazuję {startItem}-{endItem} z {totalItems} fiszek
          </>
        ) : (
          "Brak fiszek"
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Poprzednia strona</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">
          Strona {currentPage} z {totalPages || 1}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 w-8 p-0"
        >
          <span className="sr-only">Następna strona</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PaginationControls; 