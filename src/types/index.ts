export * from './flashcards';

export interface GenerationDTO {
  uuid: string;
  userId: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface FlashcardGenerateCommand {
  input: string;
}

export interface CreateFlashcardCommand {
  front: string;
  back: string;
  metoda_tworzna: 'AI' | 'manual';
} 