import type { APIRoute } from 'astro';
import { supabaseClient, DEFAULT_USER_ID } from '../../../services/supabase';
import { ErrorLogger } from '../../../utils/error-logger';
import type { UpdateFlashcardCommand, FlashcardDTO } from '../../../types';
import { createHash } from 'crypto';

// Add debug logging for all requests to this endpoint
export const all: APIRoute = async ({ request, params }) => {
  console.log(`[DEBUG] Request to /api/flashcards/${params.id} with method: ${request.method}`);
  console.log(`[DEBUG] Request params:`, JSON.stringify(params));
  console.log(`[DEBUG] Request URL:`, request.url);
  
  // Route to the appropriate handler based on method
  switch (request.method) {
    case 'GET':
      return await GET({ params } as any);
    case 'PUT':
      return await PUT({ request, params } as any);
    case 'DELETE':
      return await DELETE({ params } as any);
    default:
      return new Response(
        JSON.stringify({ error: `Method ${request.method} not allowed` }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
  }
};

/**
 * @api {get} /api/flashcards/:id Get a flashcard by ID
 * @apiName GetFlashcard
 * @apiGroup Flashcards
 * @apiVersion 1.0.0
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Flashcard ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Use DEFAULT_USER_ID for development
    const userId = DEFAULT_USER_ID;
    
    // Query the database for the specific flashcard
    const { data: flashcard, error } = await supabaseClient
      .from('flashcards')
      .select('*')
      .eq('uuid', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      // If the error is "not found", return 404
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Flashcard not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      ErrorLogger.logDatabaseError('select_by_id', error, {
        table: 'flashcards',
        uuid: id
      });
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch flashcard' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!flashcard) {
      return new Response(
        JSON.stringify({ error: 'Flashcard not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Map database record to DTO
    const flashcardDTO: FlashcardDTO = {
      uuid: flashcard.uuid,
      userId: flashcard.user_id,
      createdAt: flashcard.created_at,
      generationId: flashcard.generation_id,
      front: flashcard.przód,
      back: flashcard.tył,
      method: flashcard.metoda_tworzna,
      status: flashcard.status_recenzji,
    };
    
    return new Response(
      JSON.stringify(flashcardDTO),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    ErrorLogger.logError(error, { endpoint: `GET /flashcards/:id`, id: params.id });
    
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * @api {put} /api/flashcards/:id Update a flashcard
 * @apiName UpdateFlashcard
 * @apiGroup Flashcards
 * @apiVersion 1.0.0
 */
export const PUT: APIRoute = async ({ request, params }) => {
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
    console.log(`[DEBUG PUT] Update data received:`, JSON.stringify(updateData));
    
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
    
    // Use DEFAULT_USER_ID for development
    const userId = DEFAULT_USER_ID;
    console.log(`[DEBUG PUT] Looking for flashcard with id: ${id} and userId: ${userId}`);
    
    // Check if the flashcard exists and belongs to the user
    const { data: existingFlashcard, error: fetchError } = await supabaseClient
      .from('flashcards')
      .select('*')
      .eq('uuid', id)
      .eq('user_id', userId)
      .single();
    
    console.log(`[DEBUG PUT] Fetch result:`, JSON.stringify({ data: existingFlashcard, error: fetchError }));
    
    if (fetchError || !existingFlashcard) {
      return new Response(
        JSON.stringify({ error: 'Flashcard not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Prepare the update data
    const updateRecord = {
      przód: updateData.front,
      tył: updateData.back
    };
    
    // Update the flashcard in the database
    const { data: updatedFlashcard, error } = await supabaseClient
      .from('flashcards')
      .update(updateRecord)
      .eq('uuid', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      ErrorLogger.logDatabaseError('update', error, {
        table: 'flashcards',
        uuid: id,
        updateData
      });
      
      return new Response(
        JSON.stringify({ error: 'Failed to update flashcard' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!updatedFlashcard) {
      return new Response(
        JSON.stringify({ error: 'Flashcard not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Map database record to DTO
    const flashcardDTO: FlashcardDTO = {
      uuid: updatedFlashcard.uuid,
      userId: updatedFlashcard.user_id,
      createdAt: updatedFlashcard.created_at,
      generationId: updatedFlashcard.generation_id,
      front: updatedFlashcard.przód,
      back: updatedFlashcard.tył,
      method: updatedFlashcard.metoda_tworzna,
      status: updatedFlashcard.status_recenzji,
    };
    
    return new Response(
      JSON.stringify(flashcardDTO),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    ErrorLogger.logError(error, { endpoint: `PUT /flashcards/:id`, id: params.id });
    
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * @api {delete} /api/flashcards/:id Delete a flashcard
 * @apiName DeleteFlashcard
 * @apiGroup Flashcards
 * @apiVersion 1.0.0
 */
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Flashcard ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Use DEFAULT_USER_ID for development
    const userId = DEFAULT_USER_ID;
    
    console.log(`[DEBUG DELETE] Looking for flashcard with id: ${id} and userId: ${userId}`);
    
    // Check if the flashcard exists and belongs to the user
    const { data: existingFlashcard, error: fetchError } = await supabaseClient
      .from('flashcards')
      .select('uuid')
      .eq('uuid', id)
      .eq('user_id', userId)
      .single();
    
    console.log(`[DEBUG DELETE] Query result:`, JSON.stringify({ data: existingFlashcard, error: fetchError }));
    
    if (fetchError || !existingFlashcard) {
      return new Response(
        JSON.stringify({ error: 'Flashcard not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Delete the flashcard from the database
    const { error } = await supabaseClient
      .from('flashcards')
      .delete()
      .eq('uuid', id)
      .eq('user_id', userId);
    
    console.log(`[DEBUG DELETE] Delete result:`, JSON.stringify({ error }));
    
    if (error) {
      ErrorLogger.logDatabaseError('delete', error, {
        table: 'flashcards',
        uuid: id
      });
      
      return new Response(
        JSON.stringify({ error: 'Failed to delete flashcard' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
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
};

// Also expose individual HTTP methods for Astro routing
export const post: APIRoute = async ({ request, params }) => {
  // For compatibility, but should not be used as the main endpoint
  return await all({ request, params } as any);
};

export const put: APIRoute = async ({ params, request }) => {
  try {
    console.log(`[DEBUG PUT-NEW] Direct put handler called for ID: ${params.id}`);
    console.log(`[DEBUG PUT-NEW] Request method: ${request.method}`);
    
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Flashcard ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse the request body
    let updateData: UpdateFlashcardCommand;
    try {
      updateData = await request.json() as UpdateFlashcardCommand;
      console.log(`[DEBUG PUT-NEW] Update data received:`, JSON.stringify(updateData));
    } catch (error) {
      console.error(`[DEBUG PUT-NEW] Error parsing JSON:`, error);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Basic validation
    if (!updateData.front || !updateData.back) {
      return new Response(
        JSON.stringify({ error: 'Front and back text are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Use DEFAULT_USER_ID for development
    const userId = DEFAULT_USER_ID;
    
    console.log(`[DEBUG PUT-NEW] Attempting to update flashcard: ${id}, user: ${userId}`);
    
    // Prepare the update data
    const updateRecord = {
      przód: updateData.front,
      tył: updateData.back
    };
    
    // Update the flashcard in the database directly
    const { data: updatedFlashcard, error } = await supabaseClient
      .from('flashcards')
      .update(updateRecord)
      .eq('uuid', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    console.log(`[DEBUG PUT-NEW] Update response:`, JSON.stringify({ data: updatedFlashcard, error }));
    
    if (error) {
      console.error(`[DEBUG PUT-NEW] Update error:`, error);
      return new Response(
        JSON.stringify({ error: 'Failed to update flashcard', details: error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!updatedFlashcard) {
      return new Response(
        JSON.stringify({ error: 'Flashcard not found or not updated' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Map database record to DTO
    const flashcardDTO: FlashcardDTO = {
      uuid: updatedFlashcard.uuid,
      userId: updatedFlashcard.user_id,
      createdAt: updatedFlashcard.created_at,
      generationId: updatedFlashcard.generation_id,
      front: updatedFlashcard.przód,
      back: updatedFlashcard.tył,
      method: updatedFlashcard.metoda_tworzna,
      status: updatedFlashcard.status_recenzji,
    };
    
    return new Response(
      JSON.stringify(flashcardDTO),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[DEBUG PUT-NEW] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const del: APIRoute = async ({ params, request }) => {
  try {
    console.log(`[DEBUG DEL] Direct del handler called for ID: ${params.id}`);
    console.log(`[DEBUG DEL] Request method: ${request.method}`);
    
    const { id } = params;
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Flashcard ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Use DEFAULT_USER_ID for development
    const userId = DEFAULT_USER_ID;
    
    console.log(`[DEBUG DEL] Attempting to delete flashcard: ${id}, user: ${userId}`);
    
    // Delete the flashcard directly without checking first
    const { data, error } = await supabaseClient
      .from('flashcards')
      .delete()
      .eq('uuid', id)
      .eq('user_id', userId);
    
    console.log(`[DEBUG DEL] Delete response:`, JSON.stringify({ data, error }));
    
    if (error) {
      console.error(`[DEBUG DEL] Delete error:`, error);
      return new Response(
        JSON.stringify({ error: 'Failed to delete flashcard', details: error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ message: 'Flashcard deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`[DEBUG DEL] Unexpected error:`, error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 