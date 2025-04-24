import type { APIRoute } from 'astro';
import type { FlashcardDTO } from '@/types/flashcards';

// This would connect to your actual database in a real implementation
const mockFlashcards: FlashcardDTO[] = [
  {
    uuid: '1',
    userId: 'user1',
    createdAt: new Date().toISOString(),
    front: 'What is React?',
    back: 'A JavaScript library for building user interfaces',
    method: 'ai',
    status: 'oczekujący'
  },
  {
    uuid: '2',
    userId: 'user1',
    createdAt: new Date().toISOString(),
    front: 'What is TypeScript?',
    back: 'A strongly typed programming language that builds on JavaScript',
    method: 'ai',
    status: 'oczekujący'
  },
  {
    uuid: '3',
    userId: 'user1',
    createdAt: new Date().toISOString(),
    front: 'What is Astro?',
    back: 'A web framework for content-driven websites',
    method: 'ai',
    status: 'oczekujący'
  }
];

export const GET: APIRoute = async ({ request }) => {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    // Filter by status if provided - handle both "pending" and "oczekujący"
    let filteredFlashcards = [...mockFlashcards];
    if (status) {
      // Map "pending" to also include "oczekujący" (Polish for waiting/pending)
      if (status === 'pending') {
        filteredFlashcards = filteredFlashcards.filter(card => 
          card.status === 'pending' || card.status === 'oczekujący'
        );
      } else {
        filteredFlashcards = filteredFlashcards.filter(card => card.status === status);
      }
    }
    
    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedFlashcards = filteredFlashcards.slice(startIndex, endIndex);
    
    // Prepare response
    const response = {
      items: paginatedFlashcards,
      totalItems: filteredFlashcards.length,
      page,
      limit,
      totalPages: Math.ceil(filteredFlashcards.length / limit)
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}; 