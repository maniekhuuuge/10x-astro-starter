import { useState } from 'react';
import type { FormEvent } from 'react';
import { type GenerationDTO, type FlashcardGenerateCommand, type CreateFlashcardCommand } from '../../types';
import { Button } from '../ui/button';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import AIGenerationInput from './AIGenerationInput';

interface AIGenerationData {
  input: string;
}

const AIGenerationView = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<number>(0);
  const [errorDetails, setErrorDetails] = useState<{
    requestedTokens?: string;
    availableTokens?: string;
    details?: string;
  } | null>(null);

  // Funkcja generująca przykładowe fiszki na podstawie tekstu wejściowego
  const generateExampleFlashcards = (input: string): CreateFlashcardCommand[] => {
    // Usuwamy zbyt długie linie i dzielimy tekst na akapity
    const paragraphs = input
      .split('\n')
      .filter(p => p.trim().length > 0)
      .filter(p => p.trim().length < 200);
    
    // Tworzymy kilka przykładowych fiszek
    const flashcards: CreateFlashcardCommand[] = [];
    
    // Dodajemy fiszkę z tytułem i pierwszym akapitem (jeśli są dostępne)
    if (paragraphs.length > 0) {
      // Pierwsza fiszka: tytuł i pierwszy akapit
      const firstTitle = paragraphs[0].trim();
      const firstDefinition = paragraphs.length > 1 ? paragraphs[1].trim() : "Wygenerowana definicja";
      
      flashcards.push({
        front: firstTitle.substring(0, 200),
        back: firstDefinition.substring(0, 500),
        metoda_tworzna: 'AI'
      });
    }
    
    // Tworzymy fiszki z frazy "Co to jest X?" i odpowiedzi z tekstu
    const keywords = extractKeywords(input);
    keywords.slice(0, 3).forEach(keyword => {
      if (keyword.length > 3) {
        flashcards.push({
          front: `Co to jest ${keyword}?`,
          back: generateDefinition(input, keyword),
          metoda_tworzna: 'AI'
        });
      }
    });
    
    // Tworzymy fiszkę z pytaniem i odpowiedzią
    const randomQuestion = generateRandomQuestion(input);
    if (randomQuestion) {
      flashcards.push(randomQuestion);
    }
    
    return flashcards;
  };
  
  // Pomocnicza funkcja do wyciągania słów kluczowych z tekstu
  const extractKeywords = (text: string): string[] => {
    // Usuwamy interpunkcję i dzielimy na słowa
    const words = text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .split(/\s+/);
    
    // Usuwamy słowa krótsze niż 4 znaki i typowe słowa funkcyjne
    const stopWords = ['and', 'the', 'jest', 'oraz', 'dla', 'aby'];
    const filteredWords = words.filter(word => 
      word.length > 3 && !stopWords.includes(word)
    );
    
    // Zwracamy unikalne słowa
    return [...new Set(filteredWords)];
  };
  
  // Pomocnicza funkcja do generowania definicji
  const generateDefinition = (text: string, keyword: string): string => {
    // Szukamy zdania zawierającego słowo kluczowe
    const sentences = text.split(/[.!?]+/);
    const relevantSentence = sentences.find(s => 
      s.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (relevantSentence && relevantSentence.trim().length > 0) {
      return relevantSentence.trim().substring(0, 500);
    }
    
    // Jeśli nie znaleziono, zwracamy domyślną definicję
    return `Wygenerowana definicja dla pojęcia ${keyword}. Ta treść została wygenerowana przez AI na podstawie dostarczonego tekstu.`;
  };
  
  // Pomocnicza funkcja do generowania losowego pytania
  const generateRandomQuestion = (text: string): CreateFlashcardCommand | null => {
    const questions = [
      'Jakie są główne cechy opisanego zagadnienia?',
      'Wymień najważniejsze elementy pojęcia',
      'Jak można zastosować tę wiedzę w praktyce?'
    ];
    
    // Bierzemy losowy fragment tekstu na odpowiedź
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
    if (paragraphs.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * paragraphs.length);
    const answer = paragraphs[randomIndex].substring(0, 500);
    
    // Wybieramy losowe pytanie
    const question = questions[Math.floor(Math.random() * questions.length)];
    
    return {
      front: question,
      back: answer,
      metoda_tworzna: 'AI'
    };
  };

  // Funkcja do zapisywania wygenerowanych fiszek w bazie danych
  const saveGeneratedFlashcards = async (flashcards: CreateFlashcardCommand[]): Promise<void> => {
    try {
      const response = await fetch('/api/flashcards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(flashcards)
      });
      
      if (!response.ok) {
        throw new Error('Wystąpił błąd podczas zapisywania fiszek');
      }
      
      // Zapisujemy liczbę utworzonych fiszek
      setGeneratedFlashcards(flashcards.length);
    } catch (error) {
      console.error('Error saving flashcards:', error);
      throw error;
    }
  };

  // Funkcja symulująca generowanie fiszek przez AI (mock)
  const mockGenerateFlashcards = async (input: string): Promise<GenerationDTO> => {
    // Symulujemy opóźnienie przetwarzania
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Symulujemy różne scenariusze w zależności od zawartości tekstu
    if (input.toLowerCase().includes('error')) {
      throw new Error('Wystąpił błąd podczas przetwarzania tekstu. Spróbuj zmienić treść.');
    }

    if (input.toLowerCase().includes('timeout') || input.length > 5000) {
      throw { status: 504, message: 'Przekroczono limit czasu. Spróbuj z krótszym tekstem.' };
    }

    // Symulacja udanej odpowiedzi
    return {
      uuid: 'mock-' + Date.now(),
      userId: 'user-1',
      createdAt: new Date().toISOString(),
      status: 'completed'
    };
  };

  const handleSubmit = async (data: AIGenerationData) => {
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    setGenerationStatus('processing');
    setGeneratedFlashcards(0);

    try {
      // Use the actual API endpoint
      const response = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: data.input }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check for credit limit error
        if (response.status === 402 && errorData.code === 'CREDIT_LIMIT_EXCEEDED') {
          setGenerationStatus('credit_limit');
          setError(errorData.message || 'Limit kredytów OpenRouter został przekroczony.');
          setErrorDetails({
            requestedTokens: errorData.requestedTokens,
            availableTokens: errorData.availableTokens,
            details: errorData.details
          });
          return;
        }
        
        throw new Error(errorData.error || errorData.message || 'Wystąpił błąd podczas generowania fiszek');
      }

      const generatedFlashcards = await response.json();
      setGeneratedFlashcards(generatedFlashcards.length);
      
      setIsSuccess(true);
      setGenerationStatus('success');
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 504) {
        setGenerationStatus('timeout');
        setError('Generowanie fiszek przekroczyło limit czasu. Spróbuj z krótszym tekstem.');
      } else {
        // Check if this is a token limit error that wasn't caught earlier
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorLower = errorMessage.toLowerCase();
        
        if (errorLower.includes('credit') || 
            errorLower.includes('token') ||
            errorLower.includes('can only afford') ||
            errorLower.includes('more credits')) {
          
          // Try to extract token counts
          const tokenMatch = errorMessage.match(/(\d+) tokens, but can only afford (\d+)/);
          const requestedTokens = tokenMatch ? tokenMatch[1] : undefined;
          const availableTokens = tokenMatch ? tokenMatch[2] : undefined;
          
          console.error('Token limit error detected in frontend:', errorMessage);
          
          setGenerationStatus('credit_limit');
          setError(errorMessage);
          setErrorDetails({
            requestedTokens,
            availableTokens,
            details: tokenMatch ? `You requested ${requestedTokens} tokens, but only have ${availableTokens} available.` : 'Insufficient tokens for this operation.'
          });
          
        } else {
          setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd');
          setGenerationStatus('error');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToList = () => {
    window.location.href = '/flashcards';
  };

  const handleTryAgain = () => {
    setError(null);
    setIsSuccess(false);
    setGenerationStatus(null);
    setGeneratedFlashcards(0);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {error && (
        <div className="mb-6 p-4 border border-destructive bg-destructive/10 text-destructive rounded-md">
          <p className="mb-4 font-medium">{error}</p>
          
          {generationStatus === 'credit_limit' && (
            <div className="mb-4">
              {errorDetails?.details && (
                <p className="mb-2 text-sm">{errorDetails.details}</p>
              )}
              
              <div className="bg-background/80 p-3 rounded mb-4 text-sm font-mono">
                <p>Requested tokens: {errorDetails?.requestedTokens || 'Unknown'}</p>
                <p>Available tokens: {errorDetails?.availableTokens || 'Insufficient'}</p>
              </div>
              
              <p className="mb-4">Aby kontynuować korzystanie z generatora fiszek, możesz:</p>
              <ul className="list-disc pl-5 mb-4">
                <li>Spróbować z <strong>krótszym tekstem</strong> (około {Math.floor(Number(errorDetails?.availableTokens || 1000) / 2)} znaków)</li>
                <li>Doładować konto OpenRouter <a href="https://openrouter.ai/settings/credits" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">tutaj</a></li>
              </ul>
            </div>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleTryAgain} 
            className="flex items-center mr-2"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Spróbuj ponownie
          </Button>
        </div>
      )}
      
      {isSuccess && (
        <div className="mb-6 p-4 border border-green-400 bg-green-50 text-green-700 rounded-md">
          <p className="mb-2">Fiszki zostały pomyślnie wygenerowane!</p>
          <p className="mb-4">Utworzono {generatedFlashcards} {generatedFlashcards === 1 ? 'fiszkę' : 
            generatedFlashcards < 5 ? 'fiszki' : 'fiszek'}. Możesz je teraz znaleźć na liście fiszek.</p>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={navigateToList} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Wróć do listy fiszek
            </Button>
            <Button variant="outline" onClick={handleTryAgain} className="flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generuj ponownie
            </Button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-semibold">Generowanie fiszek z pomocą AI</h1>
      <p className="text-muted-foreground">
        Wprowadź tekst, który chcesz przekształcić w fiszki. Nasz model AI przeanalizuje tekst 
        i automatycznie wygeneruje zestaw fiszek.
      </p>

      {!isSuccess && (
        <AIGenerationInput
          onSubmit={handleSubmit}
          isLoading={isLoading}
          generationStatus={generationStatus}
        />
      )}

      <div className="mt-6 p-4 border rounded-md bg-muted/20">
        <h3 className="text-sm font-medium mb-2">Informacje o generowaniu fiszek:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Wprowadź tekst, z którego AI wygeneruje fiszki</li>
          <li>• Maksymalna długość tekstu to 10,000 znaków</li>
          <li>• Fiszki są generowane przy użyciu OpenRouter i modelu GPT-4o</li>
          <li>• Proces może potrwać kilka sekund</li>
        </ul>
      </div>
    </div>
  );
};

export default AIGenerationView; 