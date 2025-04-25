import type { FlashcardDTO } from '../../types/flashcards';
import CardFront from './CardFront';
import CardBack from './CardBack';

interface StudyCardDisplayProps {
  flashcard: FlashcardDTO;
  isBackVisible: boolean;
}

const StudyCardDisplay = ({ flashcard, isBackVisible }: StudyCardDisplayProps) => {
  return (
    <div className="border rounded-lg overflow-hidden shadow-md">
      <div className="p-6 bg-white">
        <CardFront text={flashcard.front} />
        
        {isBackVisible && (
          <div className="mt-6 pt-6 border-t">
            <CardBack text={flashcard.back} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyCardDisplay; 