import React, { useState, useEffect } from 'react';
import { ClipboardCheck } from 'lucide-react';

const FlashcardReviewButton: React.FC = () => {
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
  }, []);

  return (
    <a 
      href="/flashcards/review" 
      className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
    >
      <ClipboardCheck className="h-5 w-5" />
      <span>Review AI Flashcards</span>
      {!loading && pendingCount > 0 && (
        <span className="inline-flex items-center justify-center bg-primary-foreground text-primary h-5 min-w-5 px-1 rounded-full text-xs font-semibold">
          {pendingCount}
        </span>
      )}
    </a>
  );
};

export default FlashcardReviewButton; 