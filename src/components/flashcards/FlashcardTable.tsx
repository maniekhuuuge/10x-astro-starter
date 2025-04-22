import * as React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import FlashcardRow from "./FlashcardRow";

// FlashcardViewModel interface (same as in FlashcardsListView)
interface FlashcardViewModel {
  uuid: string;
  front: string;
  back: string;
  method: "ai" | "manual";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

interface FlashcardTableProps {
  flashcards: FlashcardViewModel[];
  onEdit: (flashcard: FlashcardViewModel) => void;
  onDelete: (flashcardId: string) => void;
}

const FlashcardTable = ({ flashcards, onEdit, onDelete }: FlashcardTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Przód</TableHead>
            <TableHead className="w-[40%]">Tył</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Metoda</TableHead>
            <TableHead className="hidden md:table-cell">Data utworzenia</TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flashcards.map((flashcard) => (
            <FlashcardRow
              key={flashcard.uuid}
              flashcard={flashcard}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FlashcardTable; 