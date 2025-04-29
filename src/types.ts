/**
 * DTO for Flashcard.
 * Maps DB fields: `przód` -> `front`, `tył` -> `back`, `metoda_tworzna` -> `method`,
 * and `status_recenzji` -> `status`. The DB entity is used as the basis for this DTO.
 */
export interface FlashcardDTO {
  uuid: string;
  userId: string;
  createdAt: string;
  generationId?: string | null;
  front: string;           // from database field `przód`
  back: string;            // from database field `tył`
  method: 'ai' | 'manual'; // from database field `metoda_tworzna` (note: DB stores lowercase 'ai')
  status: 'pending' | 'accepted' | 'rejected'; // from database field `status_recenzji`
}

/**
 * Command Model for creating one or more Flashcards.
 * The payload supports a single object or an array of objects.
 * Note: The input property `metoda_tworzna` accepts either "manual" or "AI" (uppercase for AI),
 * which may be transformed to the database format ('manual' or 'ai').
 */
export interface CreateFlashcardCommand {
  front: string;
  back: string;
  metoda_tworzna: 'manual' | 'AI';
}

/**
 * Command Model for updating an existing Flashcard.
 * Only the `front` and `back` fields are updatable.
 */
export interface UpdateFlashcardCommand {
  front: string;
  back: string;
}

/**
 * Command Model for reviewing a Flashcard.
 * The action can be 'accept', 'reject', or 'edit'. In the case of 'edit',
 * optional `front` and `back` fields can be provided for modifications.
 */
export interface FlashcardReviewCommand {
  action: 'accept' | 'reject' | 'edit';
  front?: string;
  back?: string;
}

/**
 * Command Model for initiating AI-based flashcard generation.
 * It accepts a user-provided input payload (maximum 10,000 characters).
 */
export interface FlashcardGenerateCommand {
  input: string;
  model?: string; // Optional model selection - defaults to openai/gpt-4o if not provided
}

/**
 * DTO for Generation records.
 * Directly maps to the generation entity fields from the database.
 */
export interface GenerationDTO {
  uuid: string;
  userId: string;
  createdAt: string;
  status: string;
}

/**
 * Query parameters for paginated endpoints.
 */
export interface PaginationParams {
  page: number;    // current page number
  limit: number;   // number of items per page
  sort?: string;   // optional sort field (e.g., 'created_at')
}

/**
 * A generic type to wrap paginated responses.
 */
export interface PaginatedResponse<T> {
  data: T[];         // array of items of type T
  page: number;      // current page number
  limit: number;     // maximum items per page
  total: number;     // total number of items
  totalPages: number;// total number of pages
} 