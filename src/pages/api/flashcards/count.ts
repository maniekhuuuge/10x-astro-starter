import type { APIRoute } from 'astro';
import type { FlashcardDTO } from '@/types/flashcards';

// This would connect to your actual database in a real implementation
// Updated with "oczekujący" status to match what's shown in the main view
const mockFlashcards: FlashcardDTO[] = [
  {
    uuid: '1',
    userId: 'user1',
    createdAt: new Date().toISOString(),
    front: 'What is React?',
    back: 'A JavaScript library for building user interfaces',
    method: 'ai',
    status: 'oczekujący' // Changed from 'pending' to 'oczekujący'
  },
  {
    uuid: '2',
    userId: 'user1',
    createdAt: new Date().toISOString(),
    front: 'What is TypeScript?',
    back: 'A strongly typed programming language that builds on JavaScript',
    method: 'ai',
    status: 'oczekujący' // Changed from 'pending' to 'oczekujący'
  },
  {
    uuid: '3',
    userId: 'user1',
    createdAt: new Date().toISOString(),
    front: 'What is Astro?',
    back: 'A web framework for content-driven websites',
    method: 'ai',
    status: 'oczekujący' // Changed from 'pending' to 'oczekujący'
  }
];

export const GET: APIRoute = async ({ request }) => {
  try {
    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    
    // Count flashcards that match the status filter
    let count = mockFlashcards.length;
    
    if (status) {
      // Special handling for "pending" to include both "pending" and "oczekujący"
      if (status === 'pending') {
        count = mockFlashcards.filter(card => 
          card.status === 'pending' || card.status === 'oczekujący'
        ).length;
      } else {
        count = mockFlashcards.filter(card => card.status === status).length;
      }
    }
    
    return new Response(JSON.stringify({ count }), {
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