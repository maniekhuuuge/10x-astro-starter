import React, { useState, useEffect } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/**
 * A navigation link to the flashcard review page with a count indicator
 * for pending flashcards that need review. This can be placed in a navigation menu,
 * dashboard, or sidebar.
 */
const FlashcardReviewLink: React.FC = () => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch('/api/flashcards/count?status=pending');
        if (!response.ok) {
          throw new Error('Failed to fetch pending flashcards count');
        }

        const data = await response.json();
        setPendingCount(data.count || 0);
      } catch (error) {
        console.error('Error fetching pending count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingCount();
    
    // Optional: Set up polling to keep the count updated
    const interval = setInterval(fetchPendingCount, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Button
      variant="ghost"
      className="flex items-center justify-start w-full gap-2"
      asChild
      size="sm"
    >
      <a href="/flashcards/review" className="group">
        <ClipboardCheck className="h-5 w-5" />
        <span>Review Flashcards</span>
        {!loading && pendingCount > 0 && (
          <Badge 
            variant="secondary" 
            className="ml-auto bg-primary/10 hover:bg-primary/20 text-primary"
          >
            {pendingCount}
          </Badge>
        )}
      </a>
    </Button>
  );
};

export default FlashcardReviewLink; 