import { createHash } from 'crypto';
import { supabaseClient, DEFAULT_USER_ID } from '../db/supabase.client';
import type { CreateFlashcardCommand, FlashcardDTO, PaginationParams, PaginatedResponse, UpdateFlashcardCommand, FlashcardReviewCommand, FlashcardGenerateCommand } from '../types';
import { ErrorLogger } from '../utils/error-logger';
import { OpenRouterService } from '../lib/openrouter.service';

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
   * Generates flashcards using AI based on the provided text
   * @param generateData - The command containing the input text and optionally the model to use
   * @returns Array of generated flashcard DTOs
   */
  async generateFlashcards(generateData: FlashcardGenerateCommand): Promise<FlashcardDTO[]> {
    try {
      const modelToUse = generateData.model || 'openai/gpt-4o'; // Default to GPT-4o if no model specified
      console.log(`🚀 Using OpenRouter with model ${modelToUse} to generate flashcards from text:`, generateData.input.substring(0, 50) + '...');
      console.log(`📊 Input length: ${generateData.input.length} characters`);
      
      // Create a generation record to track this batch of AI-generated flashcards
      const generationUuid = createHash('md5').update(`${Date.now()}-${Math.random()}`).digest('hex');
      console.log(`🆔 Generated UUID for this batch: ${generationUuid}`);
      
      // Create a "generation" record to track this batch
      const { error: generationError } = await supabaseClient
        .from('generations')
        .insert({
          uuid: generationUuid,
          user_id: DEFAULT_USER_ID,
          status: 'processing'
        });
      
      // If there's an RLS error, we can proceed without the generation record for development
      // In production with proper authentication, this should be fixed
      let finalGenerationId = null;
      if (generationError) {
        // Log the error but don't throw
        console.error(`⚠️ Generation record creation error: ${generationError.message}`);
        ErrorLogger.logDatabaseError('insert_generation', generationError, {
          uuid: generationUuid
        });
        console.warn('Proceeding without generation record due to RLS policy restrictions');
      } else {
        finalGenerationId = generationUuid;
        console.log(`✅ Generation record created with ID: ${finalGenerationId}`);
      }
      
      // Initialize the OpenRouter service
      console.log('🔄 Initializing OpenRouter service...');
      const openRouterService = new OpenRouterService();
      console.log('✅ OpenRouter service initialized');
      
      // Define the prompt for generating flashcards
      const systemPrompt = `
        You are an educational assistant that creates high-quality flashcards from provided content.
        Follow these guidelines:
        1. Create 3-5 flashcards based on the most important concepts in the provided text.
        2. Each flashcard should have a concise question on the front (max 200 characters) and a clear answer on the back (max 500 characters).
        3. Questions should be specific and test understanding, not just recall.
        4. Answers should be comprehensive but concise.
        5. Focus on key concepts, definitions, relationships, and principles.
        6. Return ONLY the structured JSON array without any additional text.
      `;
      
      // Configure the output schema for JSON response
      const flashcardSchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            front: { 
              type: 'string', 
              description: 'Question for the front of the flashcard (max 200 chars)' 
            },
            back: { 
              type: 'string', 
              description: 'Answer for the back of the flashcard (max 500 chars)' 
            }
          },
          required: ['front', 'back']
        }
      };
      
      try {
        // Get AI completion from OpenRouter
        console.log(`🔄 Preparing to call OpenRouter API with ${modelToUse} model...`);
        const response = await openRouterService.getChatCompletion({
          model: modelToUse,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: generateData.input }
          ],
          temperature: 0.3, // Lower temperature for more consistent results
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'flashcardGenerator',
              strict: true,
              schema: flashcardSchema
            }
          }
        });
        
        // Log the full response structure for debugging
        console.log('📦 OpenRouter API response structure:', JSON.stringify(response, null, 2).substring(0, 500) + '...');
        
        console.log(`✅ Received response from OpenRouter API. Response ID: ${response?.id || 'undefined'}`);
        console.log(`📊 Tokens used: ${response?.usage?.total_tokens || 'Unknown'} (${response?.usage?.prompt_tokens || 'Unknown'} prompt, ${response?.usage?.completion_tokens || 'Unknown'} completion)`);
        
        // Parse the response JSON
        let generatedFlashcards: { front: string; back: string }[] = [];
        try {
          // Check if response has the expected structure
          if (!response || !response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
            console.error('❌ Invalid API response structure: missing or empty choices array');
            console.error('Full response:', JSON.stringify(response));
            throw new Error('Invalid API response structure');
          }
          
          const firstChoice = response.choices[0];
          if (!firstChoice || !firstChoice.message) {
            console.error('❌ Invalid API response: first choice is missing or has no message property');
            throw new Error('Invalid choice in API response');
          }
          
          const content = firstChoice.message.content;
          console.log(`📝 Raw content from API: ${content ? content.substring(0, 100) + '...' : 'No content returned'}`);
          
          if (!content) {
            console.error('❌ No content in API response message');
            throw new Error('No content in API response');
          }
          
          try {
            generatedFlashcards = JSON.parse(content);
            console.log(`✅ Successfully parsed ${generatedFlashcards.length} flashcards from response`);
            
            // Validate the parsed data
            if (!Array.isArray(generatedFlashcards) || generatedFlashcards.length === 0) {
              throw new Error('Parsed content is not an array or is empty');
            }
            
            // Verify each flashcard has the required structure
            for (const card of generatedFlashcards) {
              if (!card.front || !card.back) {
                throw new Error('Flashcard missing required front or back property');
              }
            }
          } catch (jsonError) {
            console.error(`❌ Failed to parse content as JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
            console.error('Content to parse:', content);
            throw new Error(`Failed to parse AI-generated content as JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
          }
        } catch (parseError) {
          console.error(`❌ Error processing API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
          ErrorLogger.logError(parseError, {
            operation: 'parseGeneratedFlashcards',
            responseStructure: JSON.stringify(response)
          });
          throw new Error('Failed to parse AI-generated flashcards');
        }
        
        // Update generation status to completed
        if (finalGenerationId) {
          await supabaseClient
            .from('generations')
            .update({ status: 'completed' })
            .eq('uuid', finalGenerationId);
        }
        
        // Convert the generated flashcards to the format expected by the database
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
        
      } catch (aiError: unknown) {
        // Update generation status to failed
        if (finalGenerationId) {
          await supabaseClient
            .from('generations')
            .update({ status: 'failed' })
            .eq('uuid', finalGenerationId);
        }
        
        // Handle API timeouts or other OpenRouter issues
        ErrorLogger.logError(aiError, {
          operation: 'openRouterGeneration',
          inputLength: generateData.input.length
        });
        
        // Check specifically for token limit errors
        if (aiError instanceof Error) {
          const errorMsg = aiError.message.toLowerCase();
          if (errorMsg.includes('credit limit') || 
              errorMsg.includes('more credits') || 
              errorMsg.includes('can only afford') ||
              errorMsg.includes('token limit')) {
            console.error('🔴 Token limit error detected:', aiError.message);
            throw aiError; // Preserve the original error
          }
          
          // If it's a timeout or rate limit error, throw a custom error
          if (errorMsg.includes('timeout') || aiError.name === 'RateLimitError') {
            throw new Error('AI generation timeout');
          }
        }
        
        throw aiError;
      }
    } catch (error) {
      // Log the error with appropriate context
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