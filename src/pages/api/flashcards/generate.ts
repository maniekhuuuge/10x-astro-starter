import { flashcardService } from '../../../services/flashcard.service';
import { ErrorLogger } from '../../../utils/error-logger';
import type { FlashcardGenerateCommand } from '../../../types';
import { 
  OpenRouterApiError, 
  AuthenticationError, 
  BadRequestError, 
  RateLimitError, 
  NetworkError, 
  ParsingError 
} from '../../../lib/openrouter.service';

/**
 * POST endpoint for generating flashcards using AI via OpenRouter
 * This matches the URL path that the frontend is actually calling
 */
export const POST = async ({ request }: { request: Request }) => {
  try {
    console.log('🔥 Called /api/flashcards/generate endpoint - using OpenRouter');
    
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
    
    // Use the service to generate flashcards - this will now use OpenRouter
    const generatedFlashcards = await flashcardService.generateFlashcards(generateData);
    
    // Return the generated flashcards
    return new Response(
      JSON.stringify(generatedFlashcards),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in flashcard generation endpoint:', error);
    
    // Handle specific error types with appropriate responses
    if (error instanceof Error) {
      // Handle timeout errors
      if (error.message.includes('timeout')) {
        return new Response(
          JSON.stringify({ error: 'AI generation timed out. Please try again with a shorter input.' }),
          { status: 504, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Handle credit limit errors
      if (error instanceof RateLimitError && error.message.includes('Credit limit exceeded')) {
        // Extract the token amounts if they exist in the error message
        const tokenMatch = error.message.match(/(\d+) tokens, but can only afford (\d+)/);
        const requestedTokens = tokenMatch ? tokenMatch[1] : null;
        const availableTokens = tokenMatch ? tokenMatch[2] : null;
        
        // Pass through the raw error message to give user all the details
        const rawErrorMessage = error.message;
        
        return new Response(
          JSON.stringify({ 
            error: 'OpenRouter credit limit exceeded.',
            message: rawErrorMessage,
            details: `You requested ${requestedTokens || 'unknown'} tokens, but only have ${availableTokens || 'insufficient'} available.`,
            code: 'CREDIT_LIMIT_EXCEEDED',
            requestedTokens,
            availableTokens
          }),
          { status: 402, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Check for token limit errors that might be missed by the RateLimitError check
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('credit') || 
            errorMsg.includes('more credits') || 
            errorMsg.includes('can only afford') ||
            errorMsg.includes('token limit')) {
          
          // Try to extract token counts from the error message
          const tokenMatch = error.message.match(/(\d+) tokens, but can only afford (\d+)/);
          const requestedTokens = tokenMatch ? tokenMatch[1] : null;
          const availableTokens = tokenMatch ? tokenMatch[2] : null;
          
          console.error('🔴 Token limit error detected:', error.message);
          
          return new Response(
            JSON.stringify({ 
              error: 'OpenRouter credit limit exceeded.',
              message: error.message,
              details: tokenMatch ? `You requested ${requestedTokens} tokens, but only have ${availableTokens} available.` : 'Insufficient tokens for this operation.',
              code: 'CREDIT_LIMIT_EXCEEDED',
              requestedTokens,
              availableTokens
            }),
            { status: 402, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Handle OpenRouter specific errors
      if (error instanceof AuthenticationError) {
        return new Response(
          JSON.stringify({ error: 'Authentication error with AI service. Please contact support.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (error instanceof BadRequestError) {
        return new Response(
          JSON.stringify({ error: 'Invalid request to AI service: ' + error.message }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (error instanceof NetworkError) {
        return new Response(
          JSON.stringify({ error: 'Network error while connecting to AI service. Please try again.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Handle other rate limit errors that aren't credit-related
      if (error instanceof RateLimitError) {
        return new Response(
          JSON.stringify({ 
            error: 'AI service rate limit exceeded.', 
            message: 'The service is currently receiving too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED'
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (error instanceof ParsingError) {
        return new Response(
          JSON.stringify({ error: 'Failed to parse AI response: ' + error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (error instanceof OpenRouterApiError) {
        return new Response(
          JSON.stringify({ error: `AI service error (${error.status}): ${error.message}` }),
          { status: error.status >= 500 ? 502 : 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Check for specific error strings
      if (error.message.includes('Failed to parse AI-generated flashcards')) {
        return new Response(
          JSON.stringify({ error: 'The AI generated a response in an incorrect format. Please try again.' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Log other errors
    ErrorLogger.logError(error, { endpoint: 'POST /api/flashcards/generate' });
    
    // Generic error response
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 