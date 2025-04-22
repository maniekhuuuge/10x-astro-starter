import { flashcardService } from '../../services/flashcard.service';
import { ErrorLogger } from '../../utils/error-logger';
import type { UpdateFlashcardCommand, FlashcardReviewCommand } from '../../types';

// GET endpoint to retrieve a single flashcard by ID
export const GET = [
  async ({ params }: { params: { id?: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Flashcard ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const flashcard = await flashcardService.getFlashcardById(id);
      
      if (!flashcard) {
        return new Response(
          JSON.stringify({ error: 'Flashcard not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify(flashcard),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      ErrorLogger.logError(error, { endpoint: `GET /flashcards/:id`, id: params.id });
      
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
];

// PUT endpoint to update a flashcard
export const PUT = [
  async ({ request, params }: { request: Request, params: { id?: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Flashcard ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Parse the request body
      const updateData = await request.json() as UpdateFlashcardCommand;
      
      // Basic validation
      if (!updateData.front || !updateData.back) {
        return new Response(
          JSON.stringify({ error: 'Front and back text are required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Length validation
      if (updateData.front.length > 200) {
        return new Response(
          JSON.stringify({ error: 'Front text must be at most 200 characters' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (updateData.back.length > 500) {
        return new Response(
          JSON.stringify({ error: 'Back text must be at most 500 characters' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const updatedFlashcard = await flashcardService.updateFlashcard(id, updateData);
      
      if (!updatedFlashcard) {
        return new Response(
          JSON.stringify({ error: 'Flashcard not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify(updatedFlashcard),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      ErrorLogger.logError(error, { endpoint: `PUT /flashcards/:id`, id: params.id });
      
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
];

// POST endpoint for reviewing a flashcard (accept, reject, or edit)
export const POST = [
  async ({ request, params }: { request: Request; params: { id: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Flashcard ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Parse the request body
      const reviewData = await request.json() as FlashcardReviewCommand;
      
      // Validate the action
      if (!reviewData.action || !['accept', 'reject', 'edit'].includes(reviewData.action)) {
        return new Response(
          JSON.stringify({ error: 'Invalid action. Must be one of: accept, reject, edit' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // If action is 'edit', validate the edit data
      if (reviewData.action === 'edit') {
        if (reviewData.front === undefined && reviewData.back === undefined) {
          return new Response(
            JSON.stringify({ error: 'Edit action requires at least front or back text to be provided' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        if (reviewData.front !== undefined && reviewData.front.length > 200) {
          return new Response(
            JSON.stringify({ error: 'Front text must be at most 200 characters' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        if (reviewData.back !== undefined && reviewData.back.length > 500) {
          return new Response(
            JSON.stringify({ error: 'Back text must be at most 500 characters' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      const reviewedFlashcard = await flashcardService.reviewFlashcard(id, reviewData);
      
      if (!reviewedFlashcard) {
        return new Response(
          JSON.stringify({ error: 'Flashcard not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify(reviewedFlashcard),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      ErrorLogger.logError(error, { endpoint: `POST /flashcards/:id/review`, id: params.id });
      
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
];

// DELETE endpoint to remove a flashcard
export const DELETE = [
  async ({ params }: { params: { id: string } }) => {
    try {
      const { id } = params;
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Flashcard ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const deleted = await flashcardService.deleteFlashcard(id);
      
      if (!deleted) {
        return new Response(
          JSON.stringify({ error: 'Flashcard not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ message: 'Flashcard deleted successfully' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      ErrorLogger.logError(error, { endpoint: `DELETE /flashcards/:id`, id: params.id });
      
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
]; 