import React, { useState, useEffect } from 'react';
import type { FlashcardDTO } from '@/types/flashcards';
import FlashcardEditModal from './FlashcardEditModal';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Edit, Check, X, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  // Add useEffect to log modal state changes
  useEffect(() => {
    console.log('[FlashcardReviewList] modalState changed:', { 
      isOpen: modalState.isOpen, 
      flashcardId: modalState.flashcardToEdit?.uuid 
    });
  }, [modalState]);

  // Define fetchFlashcards outside useEffect so it can be reused by handleRetryFetch
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
        return (card.status?.toLowerCase() === 'pending') && card.method?.toLowerCase() === 'ai';
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

  useEffect(() => {
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
    console.log('[FlashcardReviewList] handleEdit called for:', flashcard.uuid);
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
  
  const handleRetryFetch = () => {
    setLoading(true);
    setError(null);
    fetchFlashcards();
  };

  // Helper function to truncate text with ellipsis if too long
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-destructive/15 p-4 rounded-md text-destructive">
        <h3 className="font-bold mb-2">Wystąpił błąd podczas ładowania fiszek</h3>
        <p className="mb-4">{error}</p>
        <Button
          onClick={handleRetryFetch}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Spróbuj ponownie
        </Button>
      </div>
    );
  }
  
  if (flashcards.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md">
        <h3 className="font-bold mb-2 text-xl">Brak fiszek do recenzji</h3>
        <p className="text-muted-foreground mb-4">
          Aktualnie nie ma żadnych fiszek oczekujących na recenzję.
        </p>
        <a href="/flashcards">
          <Button variant="outline">
            Wróć do listy fiszek
          </Button>
        </a>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Recenzja fiszek</h2>
        <div className="flex items-center space-x-2">
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 px-3 py-1">
            {flashcards.length} fiszek oczekujących
          </Badge>
          <a href="/flashcards">
            <Button variant="outline" size="sm">
              Wróć do listy fiszek
            </Button>
          </a>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Przód</TableHead>
              <TableHead className="w-[40%]">Tył</TableHead>
              <TableHead className="hidden md:table-cell">Metoda</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flashcards.map((flashcard) => (
              <TableRow key={flashcard.uuid}>
                <TableCell className="font-medium">
                  {truncateText(flashcard.front, 50)}
                </TableCell>
                <TableCell>
                  {truncateText(flashcard.back, 50)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    flashcard.method?.toLowerCase() === 'ai' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {flashcard.method?.toLowerCase() === 'ai' ? 'AI' : 'Ręcznie'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {/* Accept button */}
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAccept(flashcard.uuid)}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="h-4 w-4 stroke-green-600" style={{ color: '#16a34a' }} />
                      <span className="sr-only">Akceptuj</span>
                    </Button>
                    
                    {/* Edit button */}
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(flashcard)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4 stroke-blue-600" style={{ color: '#2563eb' }} />
                      <span className="sr-only">Edytuj</span>
                    </Button>
                    
                    {/* Reject button */}
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReject(flashcard.uuid)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4 stroke-red-600" style={{ color: '#dc2626' }} />
                      <span className="sr-only">Odrzuć</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800 flex items-start">
        <div className="mr-3 mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Wytyczne do recenzji</h4>
          <p className="text-sm">Zaakceptuj fiszki, które zawierają poprawne i wartościowe informacje. Edytuj, jeśli wymagają poprawek, lub odrzuć, jeśli są nieprzydatne.</p>
        </div>
      </div>
      
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