import { useState } from 'react';
import { type FlashcardDTO, type CreateFlashcardCommand } from '../../types';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import FlashcardForm from './FlashcardForm';

interface FlashcardFormData {
  front: string;
  back: string;
}

// Rozszerzam interfejs CreateFlashcardCommand o opcjonalne pole status
interface ExtendedCreateFlashcardCommand extends CreateFlashcardCommand {
  status_recenzji?: 'pending' | 'accepted' | 'rejected';
}

const ManualFlashcardCreateView = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (data: FlashcardFormData) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      // Rozszerzam payload o status 'accepted' dla ręcznie tworzonych fiszek
      const payload: ExtendedCreateFlashcardCommand = {
        front: data.front,
        back: data.back,
        metoda_tworzna: 'manual',
        status_recenzji: 'accepted' // Ustawiam status na 'accepted' dla ręcznie tworzonych fiszek
      };

      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Wystąpił błąd podczas zapisywania fiszki');
      }

      const createdFlashcard: FlashcardDTO = await response.json();
      
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToList = () => {
    window.location.href = '/flashcards';
  };

  return (
    <div className="max-w-2xl mx-auto">
      {error && (
        <div className="mb-6 p-4 border border-destructive bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}
      
      {isSuccess && (
        <div className="mb-6 p-4 border border-green-400 bg-green-50 text-green-700 rounded-md">
          <p className="mb-4">Fiszka została pomyślnie utworzona! Możesz ją teraz znaleźć na liście fiszek.</p>
          <Button variant="outline" onClick={navigateToList} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Wróć do listy fiszek
          </Button>
        </div>
      )}
      
      {!isSuccess && (
        <FlashcardForm 
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default ManualFlashcardCreateView; 