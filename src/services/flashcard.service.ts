import { createHash } from 'crypto';
import { supabaseClient, DEFAULT_USER_ID } from '../db/supabase.client';
import type { CreateFlashcardCommand, FlashcardDTO, PaginationParams, PaginatedResponse, UpdateFlashcardCommand, FlashcardReviewCommand, FlashcardGenerateCommand } from '../types';
import { ErrorLogger } from '../utils/error-logger';

/**
 * Service for handling flashcard operations
 */
export class FlashcardService {
  /**
   * Creates one or more flashcards in the database
   * @param flashcardsData - Single flashcard or array of flashcards to create
   * @returns Created flashcard(s) as DTO(s)
   */
  async createFlashcards(
    flashcardsData: CreateFlashcardCommand | CreateFlashcardCommand[]
  ): Promise<FlashcardDTO | FlashcardDTO[]> {
    // Handle both single flashcard and array of flashcards
    const flashcardsToCreate = Array.isArray(flashcardsData) 
      ? flashcardsData 
      : [flashcardsData];
    
    // Use DEFAULT_USER_ID for development
    const userId = DEFAULT_USER_ID;
    
    // Prepare flashcards for insertion with correct type constraints
    const flashcardRecords = flashcardsToCreate.map(flashcard => {
      // Generate a unique identifier using MD5
      const timestamp = new Date().toISOString();
      const uniqueString = `${userId}${flashcard.front}${flashcard.back}${timestamp}`;
      const uuid = createHash('md5').update(uniqueString).digest('hex');
      
      return {
        uuid,
        user_id: userId,
        przód: flashcard.front,
        tył: flashcard.back,
        metoda_tworzna: flashcard.metoda_tworzna === 'AI' ? 'ai' as const : 'manual' as const,
        status_recenzji: 'pending' as const,
      };
    });
    
    try {
      // Insert flashcards into the database
      const { data: createdFlashcards, error } = await supabaseClient
        .from('flashcards')
        .insert(flashcardRecords)
        .select();
      
      if (error) {
        ErrorLogger.logDatabaseError('insert', error, {
          table: 'flashcards',
          recordCount: flashcardRecords.length
        });
        throw new Error(`Failed to create flashcards: ${error.message}`);
      }
      
      if (!createdFlashcards || createdFlashcards.length === 0) {
        const error = new Error('No flashcards were created');
        ErrorLogger.logDatabaseError('insert_result_empty', error, {
          table: 'flashcards'
        });
        throw error;
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
      
      // Return single object or array based on input type
      return Array.isArray(flashcardsData) ? flashcardDTOs : flashcardDTOs[0];
    } catch (error) {
      // Log any uncaught errors
      ErrorLogger.logError(error, {
        operation: 'createFlashcards',
        recordCount: flashcardsToCreate.length
      });
      throw error;
    }
  }

  /**
   * Retrieves flashcards with pagination and optional filtering
   * @param params - Pagination parameters
   * @param filters - Optional filters (status, method)
   * @returns Paginated response with flashcard DTOs
   */
  async getFlashcards(
    params: PaginationParams,
    filters?: {
      status?: 'pending' | 'accepted' | 'rejected';
      method?: 'ai' | 'manual';
    }
  ): Promise<PaginatedResponse<FlashcardDTO>> {
    try {
      // Use DEFAULT_USER_ID for development
      const userId = DEFAULT_USER_ID;
      
      // Set default pagination values if not provided
      const page = params.page || 1;
      const limit = params.limit || 10;
      const offset = (page - 1) * limit;
      
      // Start building the query
      let query = supabaseClient
        .from('flashcards')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);
      
      // Apply filters if provided
      if (filters) {
        if (filters.status) {
          query = query.eq('status_recenzji', filters.status);
        }
        
        if (filters.method) {
          query = query.eq('metoda_tworzna', filters.method);
        }
      }
      
      // Apply sorting if provided in params
      if (params.sort) {
        // Map front-end sort keys to database column names
        const sortMapping: Record<string, string> = {
          'createdAt': 'created_at',
          'front': 'przód',
          'back': 'tył',
          'method': 'metoda_tworzna',
          'status': 'status_recenzji'
        };
        
        const sortKey = sortMapping[params.sort] || 'created_at';
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
        ErrorLogger.logDatabaseError('select', error, {
          table: 'flashcards',
          page,
          limit,
          filters
        });
        throw new Error(`Failed to fetch flashcards: ${error.message}`);
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
      return {
        data: flashcardDTOs,
        page,
        limit,
        total,
        totalPages
      };
    } catch (error) {
      // Log any uncaught errors
      ErrorLogger.logError(error, {
        operation: 'getFlashcards',
        pagination: params,
        filters
      });
      throw error;
    }
  }

  /**
   * Retrieves a single flashcard by its UUID
   * @param uuid - The UUID of the flashcard to retrieve
   * @returns The flashcard DTO or null if not found
   */
  async getFlashcardById(uuid: string): Promise<FlashcardDTO | null> {
    try {
      // Use DEFAULT_USER_ID for development
      const userId = DEFAULT_USER_ID;
      
      // Query the database for the specific flashcard
      const { data: flashcard, error } = await supabaseClient
        .from('flashcards')
        .select('*')
        .eq('uuid', uuid)
        .eq('user_id', userId)
        .single();
      
      if (error) {
        // If the error is "not found", return null
        if (error.code === 'PGRST116') {
          return null;
        }
        
        ErrorLogger.logDatabaseError('select_by_id', error, {
          table: 'flashcards',
          uuid
        });
        throw new Error(`Failed to fetch flashcard: ${error.message}`);
      }
      
      if (!flashcard) {
        return null;
      }
      
      // Map database record to DTO
      return {
        uuid: flashcard.uuid,
        userId: flashcard.user_id,
        createdAt: flashcard.created_at,
        generationId: flashcard.generation_id,
        front: flashcard.przód,
        back: flashcard.tył,
        method: flashcard.metoda_tworzna,
        status: flashcard.status_recenzji,
      };
    } catch (error) {
      // Log any uncaught errors
      ErrorLogger.logError(error, {
        operation: 'getFlashcardById',
        uuid
      });
      throw error;
    }
  }

  /**
   * Updates an existing flashcard
   * @param uuid - The UUID of the flashcard to update
   * @param updateData - The data to update the flashcard with
   * @returns The updated flashcard DTO or null if not found
   */
  async updateFlashcard(
    uuid: string,
    updateData: UpdateFlashcardCommand
  ): Promise<FlashcardDTO | null> {
    try {
      // Use DEFAULT_USER_ID for development
      const userId = DEFAULT_USER_ID;
      
      // Check if the flashcard exists and belongs to the user
      const existingFlashcard = await this.getFlashcardById(uuid);
      
      if (!existingFlashcard) {
        return null;
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
        .eq('uuid', uuid)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        ErrorLogger.logDatabaseError('update', error, {
          table: 'flashcards',
          uuid,
          updateData
        });
        throw new Error(`Failed to update flashcard: ${error.message}`);
      }
      
      if (!updatedFlashcard) {
        return null;
      }
      
      // Map database record to DTO
      return {
        uuid: updatedFlashcard.uuid,
        userId: updatedFlashcard.user_id,
        createdAt: updatedFlashcard.created_at,
        generationId: updatedFlashcard.generation_id,
        front: updatedFlashcard.przód,
        back: updatedFlashcard.tył,
        method: updatedFlashcard.metoda_tworzna,
        status: updatedFlashcard.status_recenzji,
      };
    } catch (error) {
      // Log any uncaught errors
      ErrorLogger.logError(error, {
        operation: 'updateFlashcard',
        uuid,
        updateData
      });
      throw error;
    }
  }

  /**
   * Reviews a flashcard (accept, reject, or edit)
   * @param uuid - The UUID of the flashcard to review
   * @param reviewData - The review data (action and optional edits)
   * @returns The reviewed flashcard DTO or null if not found
   */
  async reviewFlashcard(
    uuid: string,
    reviewData: FlashcardReviewCommand
  ): Promise<FlashcardDTO | null> {
    try {
      // Use DEFAULT_USER_ID for development
      const userId = DEFAULT_USER_ID;
      
      // Check if the flashcard exists and belongs to the user
      const existingFlashcard = await this.getFlashcardById(uuid);
      
      if (!existingFlashcard) {
        return null;
      }
      
      // Prepare the update data based on the review action
      const updateRecord: Record<string, any> = {
        status_recenzji: reviewData.action === 'accept' ? 'accepted' : 
                         reviewData.action === 'reject' ? 'rejected' : 
                         existingFlashcard.status // Keep existing status for 'edit'
      };
      
      // If the action is 'edit', update the front and back text if provided
      if (reviewData.action === 'edit') {
        if (reviewData.front !== undefined) {
          updateRecord.przód = reviewData.front;
        }
        
        if (reviewData.back !== undefined) {
          updateRecord.tył = reviewData.back;
        }
      }
      
      // Update the flashcard in the database
      const { data: reviewedFlashcard, error } = await supabaseClient
        .from('flashcards')
        .update(updateRecord)
        .eq('uuid', uuid)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        ErrorLogger.logDatabaseError('review', error, {
          table: 'flashcards',
          uuid,
          reviewData
        });
        throw new Error(`Failed to review flashcard: ${error.message}`);
      }
      
      if (!reviewedFlashcard) {
        return null;
      }
      
      // Map database record to DTO
      return {
        uuid: reviewedFlashcard.uuid,
        userId: reviewedFlashcard.user_id,
        createdAt: reviewedFlashcard.created_at,
        generationId: reviewedFlashcard.generation_id,
        front: reviewedFlashcard.przód,
        back: reviewedFlashcard.tył,
        method: reviewedFlashcard.metoda_tworzna,
        status: reviewedFlashcard.status_recenzji,
      };
    } catch (error) {
      // Log any uncaught errors
      ErrorLogger.logError(error, {
        operation: 'reviewFlashcard',
        uuid,
        reviewData
      });
      throw error;
    }
  }

  /**
   * Deletes a flashcard by its UUID
   * @param uuid - The UUID of the flashcard to delete
   * @returns True if deleted successfully, false if not found
   */
  async deleteFlashcard(uuid: string): Promise<boolean> {
    try {
      // Use DEFAULT_USER_ID for development
      const userId = DEFAULT_USER_ID;
      
      // Check if the flashcard exists and belongs to the user
      const existingFlashcard = await this.getFlashcardById(uuid);
      
      if (!existingFlashcard) {
        return false;
      }
      
      // Delete the flashcard from the database
      const { error } = await supabaseClient
        .from('flashcards')
        .delete()
        .eq('uuid', uuid)
        .eq('user_id', userId);
      
      if (error) {
        ErrorLogger.logDatabaseError('delete', error, {
          table: 'flashcards',
          uuid
        });
        throw new Error(`Failed to delete flashcard: ${error.message}`);
      }
      
      return true;
    } catch (error) {
      // Log any uncaught errors
      ErrorLogger.logError(error, {
        operation: 'deleteFlashcard',
        uuid
      });
      throw error;
    }
  }

  /**
   * Generates flashcards using AI (mocked implementation)
   * @param generateData - The input data for generating flashcards
   * @returns An array of generated flashcard DTOs
   */
  async generateFlashcards(generateData: FlashcardGenerateCommand): Promise<FlashcardDTO[]> {
    try {
      // Create a generation record to track this batch of AI-generated flashcards
      const generationUuid = createHash('md5').update(`${Date.now()}-${Math.random()}`).digest('hex');
      
      // Mock implementation that simulates AI generation
      // In a real implementation, this would call an AI service
      
      // First, create a "generation" record to track this batch
      const { error: generationError } = await supabaseClient
        .from('generations')
        .insert({
          uuid: generationUuid,
          user_id: DEFAULT_USER_ID,
          status: 'completed'
        });
      
      // If there's an RLS error, we can proceed without the generation record for development
      // In production with proper authentication, this should be fixed
      let finalGenerationId = null;
      if (generationError) {
        // Log the error but don't throw
        ErrorLogger.logDatabaseError('insert_generation', generationError, {
          uuid: generationUuid
        });
        console.warn('Proceeding without generation record due to RLS policy restrictions');
      } else {
        finalGenerationId = generationUuid;
      }
      
      // Mock some generated flashcards based on the input
      const mockGenerate = (input: string, count: number) => {
        const words = input.split(/\s+/).filter(word => word.length > 3);
        const results: CreateFlashcardCommand[] = [];
        
        // Generate a random number of flashcards between 1 and 5 (or the specified count)
        const numFlashcards = Math.min(count, Math.floor(Math.random() * 5) + 1);
        
        for (let i = 0; i < numFlashcards; i++) {
          // Pick random words from the input to create front and back
          const randomWordIndex = Math.floor(Math.random() * words.length);
          const randomWord = words[randomWordIndex] || 'concept';
          
          results.push({
            front: `What is the definition of "${randomWord}"?`,
            back: `"${randomWord}" refers to ${input.substring(0, 100)}...`,
            metoda_tworzna: 'AI'
          });
        }
        
        return results;
      };
      
      // Create a simulated delay to mimic AI processing time (500ms to 2000ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 500));
      
      // Generate between 1 and 5 flashcards
      const generatedFlashcards = mockGenerate(generateData.input, 5);
      
      // Create the flashcards in the database, using the generation ID
      const flashcardRecords = generatedFlashcards.map(flashcard => {
        const uuid = createHash('md5').update(`${DEFAULT_USER_ID}${flashcard.front}${flashcard.back}${Date.now()}`).digest('hex');
        
        return {
          uuid,
          user_id: DEFAULT_USER_ID,
          generation_id: finalGenerationId,
          przód: flashcard.front,
          tył: flashcard.back,
          metoda_tworzna: 'ai' as const,
          status_recenzji: 'pending' as const,
        };
      });
      
      // Insert the flashcards into the database
      const { data: createdFlashcards, error } = await supabaseClient
        .from('flashcards')
        .insert(flashcardRecords)
        .select();
      
      if (error) {
        ErrorLogger.logDatabaseError('insert_generated_flashcards', error, {
          generationId: finalGenerationId,
          recordCount: flashcardRecords.length
        });
        throw new Error(`Failed to create generated flashcards: ${error.message}`);
      }
      
      if (!createdFlashcards || createdFlashcards.length === 0) {
        const error = new Error('No flashcards were created');
        ErrorLogger.logDatabaseError('insert_generated_flashcards_empty', error, {
          generationId: finalGenerationId
        });
        throw error;
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
      
      return flashcardDTOs;
    } catch (error) {
      // Simulate a timeout error occasionally (10% chance)
      if (Math.random() < 0.1) {
        const timeoutError = new Error('AI generation timeout');
        
        // Log the error with appropriate context
        ErrorLogger.logError(timeoutError, {
          operation: 'generateFlashcards',
          inputLength: generateData.input.length,
          errorType: 'TIMEOUT'
        });
        
        throw timeoutError;
      }
      
      // Log any other errors
      ErrorLogger.logError(error, {
        operation: 'generateFlashcards',
        inputLength: generateData.input.length
      });
      
      throw error;
    }
  }
}

// Export a singleton instance
export const flashcardService = new FlashcardService(); 