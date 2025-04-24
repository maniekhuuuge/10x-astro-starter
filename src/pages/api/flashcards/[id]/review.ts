import type { APIRoute } from 'astro';
import type { FlashcardDTO, FlashcardReviewCommand } from '@/types/flashcards';

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

export const POST: APIRoute = async ({ request, params }) => {
  try {
    const flashcardId = params.id;
    
    if (!flashcardId) {
      return new Response(JSON.stringify({ error: 'Flashcard ID is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Find the flashcard
    const flashcardIndex = mockFlashcards.findIndex(card => card.uuid === flashcardId);
    
    if (flashcardIndex === -1) {
      return new Response(JSON.stringify({ error: 'Flashcard not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Check if flashcard is already reviewed - handle both 'pending' and 'oczekujący'
    if (mockFlashcards[flashcardIndex].status !== 'pending' && mockFlashcards[flashcardIndex].status !== 'oczekujący') {
      return new Response(JSON.stringify({ error: 'Flashcard has already been reviewed' }), {
        status: 409,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Parse the request body
    const reviewCommand: FlashcardReviewCommand = await request.json();
    
    if (!reviewCommand.action) {
      return new Response(JSON.stringify({ error: 'Review action is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Clone the flashcard to avoid mutating the original
    const updatedFlashcard: FlashcardDTO = { ...mockFlashcards[flashcardIndex] };
    
    // Process the action
    switch (reviewCommand.action) {
      case 'accept':
        updatedFlashcard.status = 'accepted';
        break;
        
      case 'reject':
        updatedFlashcard.status = 'rejected';
        break;
        
      case 'edit':
        // Validate edit data
        if (!reviewCommand.front || !reviewCommand.back) {
          return new Response(JSON.stringify({ error: 'Front and back content are required for edit action' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }
        
        // Update flashcard content and status
        updatedFlashcard.front = reviewCommand.front;
        updatedFlashcard.back = reviewCommand.back;
        updatedFlashcard.status = 'accepted';
        break;
        
      default:
        return new Response(JSON.stringify({ error: 'Invalid review action' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
    }
    
    // In a real implementation, you would update the database here
    mockFlashcards[flashcardIndex] = updatedFlashcard;
    
    return new Response(JSON.stringify(updatedFlashcard), {
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