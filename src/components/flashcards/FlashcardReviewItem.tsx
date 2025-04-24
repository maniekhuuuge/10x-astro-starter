import React from 'react';
import type { FlashcardDTO } from '@/types/flashcards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Edit, Check, X } from 'lucide-react';

interface FlashcardReviewItemProps {
  flashcard: FlashcardDTO;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (flashcard: FlashcardDTO) => void;
}

const FlashcardReviewItem: React.FC<FlashcardReviewItemProps> = ({
  flashcard,
  onAccept,
  onReject,
  onEdit,
}) => {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="font-medium border-b bg-muted/30 p-4">
        {flashcard.front}
      </CardHeader>
      <CardContent className="p-4 text-muted-foreground">
        {flashcard.back}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 p-4 pt-2 border-t bg-muted/20">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onReject(flashcard.uuid)}
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <X className="h-4 w-4 mr-1" />
          Reject
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onEdit(flashcard)}
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => onAccept(flashcard.uuid)}
        >
          <Check className="h-4 w-4 mr-1" />
          Accept
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FlashcardReviewItem; 