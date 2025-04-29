/**
 * Debug endpoint to verify routing to flashcard generation API 
 */
export const GET = async () => {
  return new Response(
    JSON.stringify({ 
      message: "Debug endpoint for flashcard generation is working",
      timestamp: new Date().toISOString(),
      path: "/api/flashcard-generate-debug"
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}; 