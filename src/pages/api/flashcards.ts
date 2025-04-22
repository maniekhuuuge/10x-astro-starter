import type { APIRoute } from 'astro';
import { supabaseClient, DEFAULT_USER_ID } from '../../db/supabase.client';
import { validateCreateFlashcardPayload } from '../../utils/validation';
import { ErrorLogger } from '../../utils/error-logger';
import type { CreateFlashcardCommand, FlashcardDTO } from '../../types';
import { createHash } from 'crypto';

// Rozszerzony interfejs dla requestu
interface ExtendedCreateFlashcardCommand extends CreateFlashcardCommand {
  status_recenzji?: 'pending' | 'accepted' | 'rejected';
}

// Typy dla wartości w bazie danych
type DbMethod = 'ai' | 'manual';
type DbStatus = 'pending' | 'accepted' | 'rejected';

/**
 * @api {post} /api/flashcards Create flashcards
 * @apiName CreateFlashcards
 * @apiGroup Flashcards
 * @apiVersion 1.0.0
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse the request body
    const requestBody = await request.json();
    
    // Validate the request body
    const validation = validateCreateFlashcardPayload(requestBody);
    
    if (!validation.valid || !validation.data) {
      return new Response(
        JSON.stringify({ error: 'Validation error', details: validation.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Use DEFAULT_USER_ID for development
    const userId = DEFAULT_USER_ID;
    
    // Handle both single flashcard and array of flashcards
    const flashcardsToCreate = Array.isArray(validation.data) 
      ? validation.data 
      : [validation.data];
    
    // Prepare flashcards for insertion with correct type constraints
    const flashcardRecords = flashcardsToCreate.map(flashcard => {
      // Sprawdzamy, czy mamy rozszerzone dane z polem status_recenzji
      const extendedFlashcard = flashcard as ExtendedCreateFlashcardCommand;
      
      // Generate a unique identifier using MD5
      const timestamp = new Date().toISOString();
      const uniqueString = `${userId}${flashcard.front}${flashcard.back}${timestamp}`;
      const uuid = createHash('md5').update(uniqueString).digest('hex');
      
      // Określamy status_recenzji: dla manualnie utworzonych 'accepted', 
      // dla AI 'pending', lub używamy przesłanej wartości
      let status: DbStatus = 'pending';
      
      // Jeśli podano status_recenzji w zapytaniu, używamy go
      if (extendedFlashcard.status_recenzji && 
          ['pending', 'accepted', 'rejected'].includes(extendedFlashcard.status_recenzji)) {
        status = extendedFlashcard.status_recenzji as DbStatus;
      }
      // Domyślnie dla metody 'manual' ustawiamy status 'accepted'
      else if (flashcard.metoda_tworzna === 'manual') {
        status = 'accepted';
      }
      
      const method: DbMethod = flashcard.metoda_tworzna === 'AI' ? 'ai' : 'manual';
      
      return {
        uuid,
        user_id: userId,
        przód: flashcard.front,
        tył: flashcard.back,
        metoda_tworzna: method,
        status_recenzji: status,
      };
    });
    
    // Insert flashcards into the database
    const { data: createdFlashcards, error } = await supabaseClient
      .from('flashcards')
      .insert(flashcardRecords)
      .select();
    
    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create flashcards' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Map database records to DTOs
    const flashcardDTOs: FlashcardDTO[] = createdFlashcards.map(card => ({
      uuid: card.uuid,
      userId: card.user_id,
      createdAt: card.created_at,
      generationId: card.generation_id,
      front: card.przód,
      back: card.tył,
      method: card.metoda_tworzna,
      status: card.status_recenzji,
    }));
    
    // Return the created flashcards
    return new Response(
      JSON.stringify(Array.isArray(validation.data) ? flashcardDTOs : flashcardDTOs[0]),
      { 
        status: 201, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * @api {get} /api/flashcards Get flashcards with pagination
 * @apiName GetFlashcards
 * @apiGroup Flashcards
 * @apiVersion 1.0.0
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    
    // Extract pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const sort = url.searchParams.get('sort') || undefined;
    
    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return new Response(
        JSON.stringify({ error: 'Invalid page parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid limit parameter. Must be between 1 and 100.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract filter parameters
    const status = url.searchParams.get('status') as 'pending' | 'accepted' | 'rejected' | null;
    const method = url.searchParams.get('method') as 'ai' | 'manual' | null;
    
    // Validate filter parameters
    if (status && !['pending', 'accepted', 'rejected'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status parameter. Must be one of: pending, accepted, rejected.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (method && !['ai', 'manual'].includes(method)) {
      return new Response(
        JSON.stringify({ error: 'Invalid method parameter. Must be one of: ai, manual.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Use DEFAULT_USER_ID for development
    const userId = DEFAULT_USER_ID;
    
    // Set default pagination values if not provided
    const offset = (page - 1) * limit;
    
    // Start building the query
    let query = supabaseClient
      .from('flashcards')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
    
    // Apply filters if provided
    if (status) {
      query = query.eq('status_recenzji', status);
    }
    
    if (method) {
      query = query.eq('metoda_tworzna', method);
    }
    
    // Apply sorting if provided in params
    if (sort) {
      // Map front-end sort keys to database column names
      const sortMapping: Record<string, string> = {
        'createdAt': 'created_at',
        'front': 'przód',
        'back': 'tył',
        'method': 'metoda_tworzna',
        'status': 'status_recenzji'
      };
      
      const sortKey = sortMapping[sort] || 'created_at';
      query = query.order(sortKey, { ascending: false }); // Default to descending (newest first)
    } else {
      // Default sort by creation date, newest first
      query = query.order('created_at', { ascending: false });
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute the query
    const { data: flashcards, error, count } = await query;
    
    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch flashcards' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Map database records to DTOs
    const flashcardDTOs: FlashcardDTO[] = (flashcards || []).map(card => ({
      uuid: card.uuid,
      userId: card.user_id,
      createdAt: card.created_at,
      generationId: card.generation_id,
      front: card.przód,
      back: card.tył,
      method: card.metoda_tworzna,
      status: card.status_recenzji,
    }));
    
    // Calculate total pages
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    
    // Return paginated response
    return new Response(
      JSON.stringify({
        data: flashcardDTOs,
        page,
        limit,
        total,
        totalPages
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}; 