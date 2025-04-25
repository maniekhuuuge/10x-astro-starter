import type { APIRoute } from 'astro';
import type { FlashcardReviewCommand, FlashcardDTO } from '@/types/flashcards';
import { supabaseClient, DEFAULT_USER_ID } from '../../../../services/supabase';
import { ErrorLogger } from '../../../../utils/error-logger';

export const POST: APIRoute = async ({ request, params }) => {
  try {
    const flashcardId = params.id;
    
    if (!flashcardId) {
      return new Response(JSON.stringify({ error: 'Flashcard ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Use DEFAULT_USER_ID for development
    const userId = DEFAULT_USER_ID;
    
    // Parse the request body first
    const reviewCommand: FlashcardReviewCommand = await request.json();
    
    if (!reviewCommand.action) {
      return new Response(JSON.stringify({ error: 'Review action is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Query the database for the specific flashcard
    const { data: flashcard, error: fetchError } = await supabaseClient
      .from('flashcards')
      .select('*')
      .eq('uuid', flashcardId)
      .eq('user_id', userId)
      .single();
    
    if (fetchError) {
      // If the error is "not found", return 404
      if (fetchError.code === 'PGRST116') {
        return new Response(JSON.stringify({ error: 'Flashcard not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      ErrorLogger.logDatabaseError('select_by_id', fetchError, {
        table: 'flashcards',
        uuid: flashcardId
      });
      
      return new Response(JSON.stringify({ error: 'Failed to fetch flashcard' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    if (!flashcard) {
      return new Response(JSON.stringify({ error: 'Flashcard not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Skip status check for edit actions
    if (reviewCommand.action !== 'edit') {
      // Check if flashcard is already reviewed - handle both 'pending' and 'oczekujący'
      const currentStatus = flashcard.status_recenzji?.toLowerCase();
      if (currentStatus !== 'pending' && currentStatus !== 'oczekujący') {
        return new Response(JSON.stringify({ error: 'Flashcard has already been reviewed' }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }
    
    // Prepare the update data based on the action
    let updateRecord: any = {};
    
    switch (reviewCommand.action) {
      case 'accept':
        updateRecord = {
          status_recenzji: 'accepted'
        };
        break;
        
      case 'reject':
        updateRecord = {
          status_recenzji: 'rejected'
        };
        break;
        
      case 'edit':
        // Validate edit data
        if (!reviewCommand.front || !reviewCommand.back) {
          return new Response(JSON.stringify({ error: 'Front and back content are required for edit action' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
        
        // Length validation
        if (reviewCommand.front.length > 200) {
          return new Response(JSON.stringify({ error: 'Front text must be at most 200 characters' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
        
        if (reviewCommand.back.length > 500) {
          return new Response(JSON.stringify({ error: 'Back text must be at most 500 characters' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
        
        // Update flashcard content and status
        updateRecord = {
          przód: reviewCommand.front,
          tył: reviewCommand.back,
          status_recenzji: 'accepted'
        };
        break;
        
      default:
        return new Response(JSON.stringify({ error: 'Invalid review action' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
    }
    
    // Update the flashcard in the database
    const { data: updatedFlashcard, error: updateError } = await supabaseClient
      .from('flashcards')
      .update(updateRecord)
      .eq('uuid', flashcardId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) {
      ErrorLogger.logDatabaseError('update', updateError, {
        table: 'flashcards',
        uuid: flashcardId,
        updateRecord
      });
      
      return new Response(JSON.stringify({ error: 'Failed to update flashcard' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Map database record to DTO
    const updatedFlashcardDTO: FlashcardDTO = {
      uuid: updatedFlashcard.uuid,
      userId: updatedFlashcard.user_id,
      createdAt: updatedFlashcard.created_at,
      generationId: updatedFlashcard.generation_id,
      front: updatedFlashcard.przód,
      back: updatedFlashcard.tył,
      method: updatedFlashcard.metoda_tworzna,
      status: updatedFlashcard.status_recenzji,
    };
    
    return new Response(JSON.stringify(updatedFlashcardDTO), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error handling request:', error);
    ErrorLogger.logError(error, { 
      endpoint: `POST /flashcards/:id/review`, 
      id: params.id 
    });
    
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 