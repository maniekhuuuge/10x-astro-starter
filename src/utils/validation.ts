import type { CreateFlashcardCommand } from '../types';

/**
 * Validates a create flashcard request payload
 * @param data - The data to validate (single flashcard or array of flashcards)
 * @returns An object with validation result and any errors
 */
export function validateCreateFlashcardPayload(data: unknown): { 
  valid: boolean; 
  data?: CreateFlashcardCommand | CreateFlashcardCommand[]; 
  errors?: string[] 
} {
  try {
    const errors: string[] = [];
    
    // Check if data is an object or an array
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return { valid: false, errors: ['At least one flashcard is required'] };
      }
      
      if (data.length > 100) {
        return { valid: false, errors: ['Cannot create more than 100 flashcards at once'] };
      }
      
      const validatedData: CreateFlashcardCommand[] = [];
      
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const validation = validateSingleFlashcard(item, `flashcard[${i}]`);
        
        if (!validation.valid) {
          errors.push(...(validation.errors || []));
        } else if (validation.data) {
          validatedData.push(validation.data);
        }
      }
      
      if (errors.length > 0) {
        return { valid: false, errors };
      }
      
      return { valid: true, data: validatedData };
    } else {
      const validation = validateSingleFlashcard(data, 'flashcard');
      
      if (!validation.valid) {
        return { valid: false, errors: validation.errors };
      }
      
      return { valid: true, data: validation.data };
    }
  } catch (error) {
    return { valid: false, errors: ['Invalid input data'] };
  }
}

/**
 * Validates a single flashcard object
 * @param data - The data to validate
 * @param prefix - Prefix for error messages
 * @returns Validation result
 */
function validateSingleFlashcard(data: unknown, prefix: string): { 
  valid: boolean; 
  data?: CreateFlashcardCommand; 
  errors?: string[] 
} {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: [`${prefix}: Must be an object`] };
  }
  
  const flashcard = data as Record<string, unknown>;
  
  // Validate front
  if (!flashcard.front) {
    errors.push(`${prefix}: Front text is required`);
  } else if (typeof flashcard.front !== 'string') {
    errors.push(`${prefix}: Front text must be a string`);
  } else if (flashcard.front.length > 200) {
    errors.push(`${prefix}: Front text must be at most 200 characters`);
  }
  
  // Validate back
  if (!flashcard.back) {
    errors.push(`${prefix}: Back text is required`);
  } else if (typeof flashcard.back !== 'string') {
    errors.push(`${prefix}: Back text must be a string`);
  } else if (flashcard.back.length > 500) {
    errors.push(`${prefix}: Back text must be at most 500 characters`);
  }
  
  // Validate metoda_tworzna
  if (!flashcard.metoda_tworzna) {
    errors.push(`${prefix}: Creation method is required`);
  } else if (typeof flashcard.metoda_tworzna !== 'string') {
    errors.push(`${prefix}: Creation method must be a string`);
  } else if (flashcard.metoda_tworzna !== 'manual' && flashcard.metoda_tworzna !== 'AI') {
    errors.push(`${prefix}: Creation method must be either "manual" or "AI"`);
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  return { 
    valid: true, 
    data: {
      front: flashcard.front as string,
      back: flashcard.back as string,
      metoda_tworzna: flashcard.metoda_tworzna as 'manual' | 'AI'
    } 
  };
} 