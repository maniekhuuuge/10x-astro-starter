import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isDeleting: boolean;
}

const DeleteConfirmationModal = ({
  isOpen,
  onConfirm,
  onClose,
  isDeleting,
}: DeleteConfirmationModalProps) => {
  // Handle confirmation
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error("Error deleting flashcard:", error);
    }
  };

  // Create a simplified version using Dialog since AlertDialog might not be available
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć tę fiszkę?</AlertDialogTitle>
          <AlertDialogDescription>
            Ta operacja jest nieodwracalna. Fiszka zostanie trwale usunięta z systemu.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose} disabled={isDeleting}>
              Anuluj
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Usuwanie..." : "Usuń"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmationModal; 