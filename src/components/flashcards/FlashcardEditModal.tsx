import React, { useState, useEffect } from 'react';
import type { FlashcardDTO } from '@/types/flashcards';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface FlashcardEditModalProps {
  isOpen: boolean;
  flashcard: FlashcardDTO | null;
  onSave: (id: string, data: { front: string; back: string }) => void;
  onClose: () => void;
}

const FlashcardEditModal: React.FC<FlashcardEditModalProps> = ({
  isOpen,
  flashcard,
  onSave,
  onClose,
}) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [errors, setErrors] = useState<{
    front: string | null;
    back: string | null;
  }>({
    front: null,
    back: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Reset form when flashcard changes
  useEffect(() => {
    if (flashcard) {
      setFront(flashcard.front);
      setBack(flashcard.back);
      setErrors({ front: null, back: null });
    }
  }, [flashcard]);

  const validateForm = (): boolean => {
    const newErrors = {
      front: null as string | null,
      back: null as string | null,
    };

    // Validate front
    if (!front.trim()) {
      newErrors.front = 'Front side is required';
    } else if (front.length > 200) {
      newErrors.front = `Front side is too long (${front.length}/200)`;
    }

    // Validate back
    if (!back.trim()) {
      newErrors.back = 'Back side is required';
    } else if (back.length > 500) {
      newErrors.back = `Back side is too long (${back.length}/500)`;
    }

    setErrors(newErrors);
    return !newErrors.front && !newErrors.back;
  };

  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFront(value);
    
    // Live validation
    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, front: 'Front side is required' }));
    } else if (value.length > 200) {
      setErrors((prev) => ({ ...prev, front: `Front side is too long (${value.length}/200)` }));
    } else {
      setErrors((prev) => ({ ...prev, front: null }));
    }
  };

  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setBack(value);
    
    // Live validation
    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, back: 'Back side is required' }));
    } else if (value.length > 500) {
      setErrors((prev) => ({ ...prev, back: `Back side is too long (${value.length}/500)` }));
    } else {
      setErrors((prev) => ({ ...prev, back: null }));
    }
  };

  const handleSubmit = async () => {
    if (!flashcard) return;
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(flashcard.uuid, { front, back });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
          <DialogDescription>
            Make changes to the flashcard content. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="front">
              Front <span className="text-xs text-muted-foreground">(max 200 chars)</span>
            </Label>
            <Input
              id="front"
              value={front}
              onChange={handleFrontChange}
              placeholder="Enter the front side text"
              className={errors.front ? 'border-destructive' : ''}
            />
            {errors.front && (
              <p className="text-sm text-destructive">{errors.front}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="back">
              Back <span className="text-xs text-muted-foreground">(max 500 chars)</span>
            </Label>
            <Textarea
              id="back"
              value={back}
              onChange={handleBackChange}
              placeholder="Enter the back side text"
              rows={5}
              className={errors.back ? 'border-destructive' : ''}
            />
            {errors.back && (
              <p className="text-sm text-destructive">{errors.back}</p>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving || Boolean(errors.front) || Boolean(errors.back)}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlashcardEditModal; 