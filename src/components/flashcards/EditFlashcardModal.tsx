import * as React from "react";
import { useState, useEffect } from "react";
import type { UpdateFlashcardCommand } from "../../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";

// FlashcardViewModel interface (same as in FlashcardsListView)
interface FlashcardViewModel {
  uuid: string;
  front: string;
  back: string;
  method: "ai" | "manual";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

interface EditFlashcardModalProps {
  isOpen: boolean;
  flashcard: FlashcardViewModel | null;
  onSave: (flashcardId: string, data: UpdateFlashcardCommand) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
}

interface FormErrors {
  front?: string;
  back?: string;
}

const EditFlashcardModal = ({
  isOpen,
  flashcard,
  onSave,
  onClose,
  isSaving,
}: EditFlashcardModalProps) => {
  // Form state
  const [formData, setFormData] = useState<UpdateFlashcardCommand>({
    front: "",
    back: "",
  });

  // Error state
  const [errors, setErrors] = useState<FormErrors>({});

  // Initialize form with flashcard data when opened
  useEffect(() => {
    if (flashcard) {
      setFormData({
        front: flashcard.front,
        back: flashcard.back,
      });
      setErrors({});
    }
  }, [flashcard, isOpen]);

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Live validation
    validateField(name, value);
  };

  // Validate a single field
  const validateField = (name: string, value: string) => {
    let fieldErrors: FormErrors = { ...errors };

    switch (name) {
      case "front":
        if (!value.trim()) {
          fieldErrors.front = "Pole przód jest wymagane";
        } else if (value.length > 200) {
          fieldErrors.front = "Maksymalna długość to 200 znaków";
        } else {
          delete fieldErrors.front;
        }
        break;
      case "back":
        if (!value.trim()) {
          fieldErrors.back = "Pole tył jest wymagane";
        } else if (value.length > 500) {
          fieldErrors.back = "Maksymalna długość to 500 znaków";
        } else {
          delete fieldErrors.back;
        }
        break;
    }

    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  // Validate the entire form
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Validate front
    if (!validateField("front", formData.front)) {
      isValid = false;
    }
    
    // Validate back
    if (!validateField("back", formData.back)) {
      isValid = false;
    }
    
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && flashcard) {
      try {
        await onSave(flashcard.uuid, formData);
      } catch (error) {
        console.error("Error saving flashcard:", error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="front">
              Przód <span className="text-destructive">*</span>
            </Label>
            <Input
              id="front"
              name="front"
              value={formData.front}
              onChange={handleChange}
              placeholder="Wprowadź tekst przodu fiszki"
              className={errors.front ? "border-destructive" : ""}
              disabled={isSaving}
            />
            {errors.front && (
              <p className="text-xs text-destructive">{errors.front}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.front.length}/200 znaków
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="back">
              Tył <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="back"
              name="back"
              value={formData.back}
              onChange={handleChange}
              placeholder="Wprowadź tekst tyłu fiszki"
              className={`min-h-[100px] ${errors.back ? "border-destructive" : ""}`}
              disabled={isSaving}
            />
            {errors.back && (
              <p className="text-xs text-destructive">{errors.back}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.back.length}/500 znaków
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={
                isSaving || 
                Object.keys(errors).length > 0 || 
                !formData.front.trim() || 
                !formData.back.trim()
              }
            >
              {isSaving ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFlashcardModal; 