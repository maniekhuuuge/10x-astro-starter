import { flashcardService } from '../../services/flashcard.service';
import { ErrorLogger } from '../../utils/error-logger';
import type { FlashcardGenerateCommand } from '../../types';

/**
 * POST endpoint for generating flashcards using AI
 */
export const POST = async ({ request }: { request: Request }) => {
  try {
    // Parse the request body
    const generateData = await request.json() as FlashcardGenerateCommand;
    // Validate the input
    if (!generateData.input) {
      return new Response(
        JSON.stringify({ error: 'Input text is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validate input length (max 10,000 characters as per spec)
    if (generateData.input.length > 10000) {
      return new Response(
        JSON.stringify({ error: 'Input text must be at most 10,000 characters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Use the service to generate flashcards
    const generatedFlashcards = await flashcardService.generateFlashcards(generateData);
    
    // Return the generated flashcards
    return new Response(
      JSON.stringify(generatedFlashcards),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Handle timeout errors specifically
    if (error instanceof Error && error.message.includes('timeout')) {
      return new Response(
        JSON.stringify({ error: 'AI generation timed out. Please try again with a shorter input.' }),
        { status: 504, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Log other errors
    ErrorLogger.logError(error, { endpoint: 'POST /flashcards/generate' });
    
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 