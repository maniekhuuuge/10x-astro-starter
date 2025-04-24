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
        
        // Prepare request details
        const url = '/api/flashcards';
        const method = 'GET';
        const headers = {};
        
        // Log equivalent curl command
        console.log('%c 🔍 API Request Details', 'background: #3498db; color: white; font-size: 12px; padding: 4px;');
        console.log(`Fetching flashcards with equivalent curl:`);
        console.log(`curl -X ${method} "${window.location.origin}${url}"`);
        
        // Make the request
        console.time('API Request Time');
        const response = await fetch(url, { method, headers });
        console.timeEnd('API Request Time');
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          try {
            // Try to parse as JSON to see if there's structured error info
            const errorJson = JSON.parse(errorText);
            console.error('Parsed error JSON:', errorJson);
          } catch (e) {
            // Not JSON, continue with text error
          }
          throw new Error(`Error ${response.status}: Failed to load flashcards for review. ${errorText}`);
        }
        
        const responseClone = response.clone();
        const rawText = await responseClone.text();
        console.log('Raw response text:', rawText);
        
        const data = await response.json();
        console.log('%c 📋 API Response Data', 'background: #2ecc71; color: white; font-size: 12px; padding: 4px;');
        console.log(JSON.stringify(data, null, 2));
        console.log('Items count:', data.data ? data.data.length : 0);
        
        if (data.data && data.data.length > 0) {
          console.log('First item example:', JSON.stringify(data.data[0], null, 2));
        } else {
          console.warn('No items returned from API');
        }
        
        // Filter the results in the client-side instead
        console.log('%c 🔍 Filtering Flashcards', 'background: #f39c12; color: white; font-size: 12px; padding: 4px;');
        const filteredFlashcards = (data.data || []).filter((card: FlashcardDTO) => {
          console.log('Card details:', JSON.stringify(card, null, 2));
          console.log('Card status check:', {
            uuid: card.uuid,
            status: card.status,
            method: card.method,
            statusLowerCase: card.status?.toLowerCase(),
            matchesPending: card.status?.toLowerCase() === 'pending'
          });
          return (card.status?.toLowerCase() === 'pending');
          /*&& card.method === 'ai'*/
        });
        
        console.log('Filtered flashcards count:', filteredFlashcards.length);
        console.log('Filtered flashcards:', JSON.stringify(filteredFlashcards, null, 2));
        
        setFlashcards(filteredFlashcards);
        setError(null);
      } catch (err) {
        console.error('%c ❌ Error in fetchFlashcards', 'background: #e74c3c; color: white; font-size: 12px; padding: 4px;');
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to load flashcards');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFlashcards();
  }, []);
  
  const handleAccept = async (id: string) => {
    try {
      // Prepare request details
      const url = `/api/flashcards/${id}/review`;
      const method = 'POST';
      const headers = { 'Content-Type': 'application/json' };
      const body = JSON.stringify({ action: 'accept' });
      
      // Log equivalent curl command
      console.log('%c 🔄 Accept Flashcard Request', 'background: #3498db; color: white; font-size: 12px; padding: 4px;');
      console.log(`Accepting flashcard with equivalent curl:`);
      console.log(`curl -X ${method} "${window.location.origin}${url}" \\
  -H "Content-Type: application/json" \\
  -d '${body}'`);
      
      // Make the request
      console.time('Accept Request Time');
      const response = await fetch(url, { 
        method, 
        headers, 
        body 
      });
      console.timeEnd('Accept Request Time');
      console.log('Accept response status:', response.status);
      console.log('Accept response headers:', Object.fromEntries([...response.headers.entries()]));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error accepting flashcard - response:', errorText);
        try {
          // Try to parse as JSON to see if there's structured error info
          const errorJson = JSON.parse(errorText);
          console.error('Parsed error JSON:', errorJson);
        } catch (e) {
          // Not JSON, continue with text error
        }
        throw new Error(`Error ${response.status}: Failed to accept flashcard`);
      }
      
      const responseClone = response.clone();
      const rawText = await responseClone.text();
      console.log('Raw accept response text:', rawText);
      
      const data = await response.json();
      console.log('Accept response data:', JSON.stringify(data, null, 2));
      
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
      // Prepare request details
      const url = `/api/flashcards/${id}/review`;
      const method = 'POST';
      const headers = { 'Content-Type': 'application/json' };
      const body = JSON.stringify({ action: 'reject' });
      
      // Log equivalent curl command
      console.log('%c 🚫 Reject Flashcard Request', 'background: #e74c3c; color: white; font-size: 12px; padding: 4px;');
      console.log(`Rejecting flashcard with equivalent curl:`);
      console.log(`curl -X ${method} "${window.location.origin}${url}" \\
  -H "Content-Type: application/json" \\
  -d '${body}'`);
      
      const response = await fetch(url, {
        method,
        headers,
        body
      });
      console.log('Reject response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error rejecting flashcard - response:', errorText);
        throw new Error(`Error ${response.status}: Failed to reject flashcard`);
      }
      
      const responseData = await response.json();
      console.log('Reject response data:', JSON.stringify(responseData, null, 2));
      
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
  
  const handleSaveEdit = async (id: string, formData: { front: string; back: string }) => {
    try {
      // Prepare request details
      const url = `/api/flashcards/${id}/review`;
      const method = 'POST';
      const headers = { 'Content-Type': 'application/json' };
      const body = JSON.stringify({
        action: 'edit',
        front: formData.front,
        back: formData.back,
      });
      
      // Log equivalent curl command
      console.log('%c ✏️ Edit Flashcard Request', 'background: #9b59b6; color: white; font-size: 12px; padding: 4px;');
      console.log(`Editing flashcard with equivalent curl:`);
      console.log(`curl -X ${method} "${window.location.origin}${url}" \\
  -H "Content-Type: application/json" \\
  -d '${body}'`);
      
      const response = await fetch(url, {
        method,
        headers,
        body
      });
      console.log('Edit response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error editing flashcard - response:', errorText);
        throw new Error(`Error ${response.status}: Failed to edit flashcard`);
      }
      
      const responseData = await response.json();
      console.log('Edit response data:', JSON.stringify(responseData, null, 2));
      
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