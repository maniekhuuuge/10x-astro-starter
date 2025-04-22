import * as React from "react";
import { TableCell, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { Edit, Trash, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

// FlashcardViewModel interface (same as in FlashcardsListView)
interface FlashcardViewModel {
  uuid: string;
  front: string;
  back: string;
  method: "ai" | "manual";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

interface FlashcardRowProps {
  flashcard: FlashcardViewModel;
  onEdit: (flashcard: FlashcardViewModel) => void;
  onDelete: (flashcardId: string) => void;
}

const FlashcardRow = ({ flashcard, onEdit, onDelete }: FlashcardRowProps) => {
  // Helper function to truncate text with ellipsis if too long
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // Helper function to get status display text in Polish
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Oczekujący";
      case "accepted":
        return "Zaakceptowany";
      case "rejected":
        return "Odrzucony";
      default:
        return status;
    }
  };

  // Helper function to get method display text in Polish
  const getMethodText = (method: string) => {
    switch (method) {
      case "ai":
        return "AI";
      case "manual":
        return "Ręcznie";
      default:
        return method;
    }
  };

  // Helper function to get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        {truncateText(flashcard.front, 50)}
      </TableCell>
      <TableCell>{truncateText(flashcard.back, 50)}</TableCell>
      <TableCell className="hidden md:table-cell">
        <span
          className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
            flashcard.status
          )}`}
        >
          {getStatusText(flashcard.status)}
        </span>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {getMethodText(flashcard.method)}
      </TableCell>
      <TableCell className="hidden md:table-cell">{flashcard.createdAt}</TableCell>
      <TableCell className="text-right">
        {/* Desktop buttons */}
        <div className="hidden md:flex md:justify-end md:space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(flashcard)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edytuj</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(flashcard.uuid)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Usuń</span>
          </Button>
        </div>

        {/* Mobile dropdown */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Opcje</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(flashcard)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edytuj</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(flashcard.uuid)}>
                <Trash className="mr-2 h-4 w-4" />
                <span>Usuń</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default FlashcardRow; 