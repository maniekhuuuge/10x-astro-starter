import React, { useState, useEffect } from 'react';
import type { FlashcardDTO } from '@/types/flashcards';
import FlashcardEditModal from './FlashcardEditModal';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import FlashcardReviewItem from './FlashcardReviewItem';

const FlashcardReviewList: React.FC = () => {
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    flashcardToEdit: FlashcardDTO | null;
  }>({
    isOpen: false,
    flashcardToEdit: null,
  });
  
  const { toast } = useToast();

  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        setLoading(true);
        // Let's try a simpler approach to isolate the issue
        const response = await fetch('/api/flashcards');
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error ${response.status}: Failed to load flashcards for review. ${errorText}`);
        }
        
        const data = await response.json();
        
        // Filter the results in the client-side instead
        const filteredFlashcards = (data.items || []).filter((card: FlashcardDTO) => 
          (card.status.toLowerCase() === 'pending') && 
          card.method === 'ai'
        );
        
        setFlashcards(filteredFlashcards);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load flashcards');
        console.error('Error fetching flashcards:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFlashcards();
  }, []);
  
  const handleAccept = async (id: string) => {
    try {
      const response = await fetch(`/api/flashcards/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'accept' }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to accept flashcard`);
      }
      
      // Remove the flashcard from the list
      setFlashcards((prev) => prev.filter((flashcard) => flashcard.uuid !== id));
      toast({
        title: 'Flashcard accepted',
        description: 'The flashcard has been successfully accepted.',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to accept flashcard',
      });
      console.error('Error accepting flashcard:', err);
    }
  };
  
  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/flashcards/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to reject flashcard`);
      }
      
      // Remove the flashcard from the list
      setFlashcards((prev) => prev.filter((flashcard) => flashcard.uuid !== id));
      toast({
        title: 'Flashcard rejected',
        description: 'The flashcard has been successfully rejected.',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to reject flashcard',
      });
      console.error('Error rejecting flashcard:', err);
    }
  };
  
  const handleEdit = (flashcard: FlashcardDTO) => {
    setModalState({
      isOpen: true,
      flashcardToEdit: flashcard,
    });
  };
  
  const handleSaveEdit = async (id: string, data: { front: string; back: string }) => {
    try {
      const response = await fetch(`/api/flashcards/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'edit',
          front: data.front,
          back: data.back,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: Failed to edit flashcard`);
      }
      
      // Remove the flashcard from the list and close the modal
      setFlashcards((prev) => prev.filter((flashcard) => flashcard.uuid !== id));
      setModalState({ isOpen: false, flashcardToEdit: null });
      toast({
        title: 'Flashcard edited',
        description: 'The flashcard has been successfully edited and accepted.',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to edit flashcard',
      });
      console.error('Error editing flashcard:', err);
    }
  };
  
  const handleCloseModal = () => {
    setModalState({ isOpen: false, flashcardToEdit: null });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
        <span className="ml-3">Loading flashcards...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No flashcards waiting for review.
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <ul className="space-y-4">
        {flashcards.map((flashcard) => (
          <FlashcardReviewItem 
            key={flashcard.uuid}
            flashcard={flashcard}
            onAccept={handleAccept}
            onReject={handleReject}
            onEdit={handleEdit}
          />
        ))}
      </ul>
      
      <FlashcardEditModal 
        isOpen={modalState.isOpen}
        flashcard={modalState.flashcardToEdit}
        onSave={handleSaveEdit}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default FlashcardReviewList; 