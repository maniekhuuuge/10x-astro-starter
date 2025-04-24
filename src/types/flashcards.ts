export interface FlashcardDTO {
  uuid: string;
  userId: string;
  createdAt: string;
  generationId?: string | null;
  front: string;
  back: string;
  method: 'ai' | 'manual';
  status: 'pending' | 'accepted' | 'rejected' | 'oczekujący';
}

export interface FlashcardReviewCommand {
  action: 'accept' | 'reject' | 'edit';
  front?: string; // Required only for action: 'edit'
  back?: string;  // Required only for action: 'edit'
}

export interface UpdateFlashcardCommand {
  front: string;
  back: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
} 