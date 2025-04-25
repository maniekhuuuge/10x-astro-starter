import { useState, useEffect } from 'react';
import type { FlashcardDTO } from '../../types/flashcards';
import StudyCardDisplay from './StudyCardDisplay';
import { Button } from '../ui/button';
import MessageDisplay from './MessageDisplay';

const StudySessionView = () => {
  // State for flashcards and session management
  const [flashcards, setFlashcards] = useState<FlashcardDTO[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isBackVisible, setIsBackVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [noCardsAvailable, setNoCardsAvailable] = useState(false);

  // Fetch flashcards when component mounts
  useEffect(() => {
    const fetchFlashcards = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch accepted flashcards from API
        const response = await fetch('/api/flashcards?status=accepted');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: Could not fetch flashcards`);
        }
        
        const data = await response.json();
        const fetchedFlashcards = data.data || data.items || [];
        
        // Update state based on fetched data
        setFlashcards(fetchedFlashcards);
        setIsLoading(false);
        
        if (fetchedFlashcards.length === 0) {
          setNoCardsAvailable(true);
        }
      } catch (err) {
        setIsLoading(false);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    };
    
    fetchFlashcards();
  }, []);

  // Handle showing answer (back of card)
  const handleShowAnswer = () => {
    setIsBackVisible(true);
  };
  
  // Handle moving to next card
  const handleNextCard = () => {
    // Check if there are more cards
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsBackVisible(false);
    } else {
      // End of session
      setIsSessionFinished(true);
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <MessageDisplay 
        message={`Nie udało się pobrać fiszek. ${error}. Spróbuj ponownie później.`} 
      >
        <a 
          href="/flashcards" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mt-4"
        >
          Wróć do listy fiszek
        </a>
      </MessageDisplay>
    );
  }

  // Handle no cards available state
  if (noCardsAvailable) {
    return (
      <MessageDisplay 
        message="Gratulacje! Nie masz więcej fiszek do powtórzenia na dziś." 
      >
        <a 
          href="/flashcards" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mt-4"
        >
          Wróć do listy fiszek
        </a>
      </MessageDisplay>
    );
  }

  // Handle session finished state
  if (isSessionFinished) {
    return (
      <MessageDisplay 
        message="Sesja zakończona! Wszystkie fiszki na dziś zostały powtórzone." 
      >
        <a 
          href="/flashcards" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mt-4"
        >
          Wróć do listy fiszek
        </a>
      </MessageDisplay>
    );
  }

  // Current card to display
  const currentCard = flashcards[currentCardIndex];

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <a 
          href="/flashcards" 
          className="text-sm text-muted-foreground hover:text-primary flex items-center"
        >
          ← Wróć do listy fiszek
        </a>
        <p className="text-sm text-muted-foreground">
          {currentCardIndex + 1} / {flashcards.length}
        </p>
      </div>
      
      {/* Display current flashcard */}
      <StudyCardDisplay 
        flashcard={currentCard} 
        isBackVisible={isBackVisible} 
      />
      
      <div className="mt-8 flex justify-center gap-4">
        {!isBackVisible ? (
          <>
            <Button size="lg" onClick={handleShowAnswer}>
              Pokaż odpowiedź
            </Button>
          </>
        ) : (
          <Button size="lg" onClick={handleNextCard}>
            Następna
          </Button>
        )}
      </div>
    </div>
  );
};

export default StudySessionView; 