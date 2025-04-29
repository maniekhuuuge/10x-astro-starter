import type { APIRoute } from 'astro';
import { OpenRouterService, ValidationError, AuthenticationError, RateLimitError } from '../../lib/openrouter.service';

export interface ChatRequest {
  userMessage: string;
  context?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  reply: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Chat completion API endpoint
 * 
 * Accepts a POST request with user message and optional parameters,
 * then returns the AI assistant's response from OpenRouter.
 * 
 * @example
 * // Request
 * fetch('/api/chat', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     userMessage: 'Hello, how can you help me?',
 *     context: 'User is a developer looking for assistance',
 *     model: 'openai/gpt-4o'
 *   })
 * })
 * 
 * // Response
 * {
 *   reply: 'I can help you with coding questions, debugging, and explaining technical concepts...',
 *   model: 'openai/gpt-4o',
 *   promptTokens: 30,
 *   completionTokens: 45,
 *   totalTokens: 75
 * }
 */
export const POST: APIRoute = async ({ request }) => {
  console.log('🔍 API: /api/chat endpoint called');
  
  try {
    // Initialize the OpenRouter service
    console.log('🔍 API: Creating OpenRouterService instance');
    const openRouterService = new OpenRouterService();
    console.log('✅ API: OpenRouterService instance created successfully');
    
    // Parse the request body
    const body = await request.json() as ChatRequest;
    console.log('🔍 API: Request body parsed:', JSON.stringify(body));
    
    // Validate required fields
    if (!body.userMessage) {
      console.log('❌ API: Missing required field: userMessage');
      return new Response(
        JSON.stringify({ error: 'Missing required field: userMessage' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Set default values if not provided
    const model = body.model || 'openai/gpt-4o';
    const temperature = body.temperature ?? 0.7;
    const maxTokens = body.maxTokens ?? 1000;
    
    console.log(`🔍 API: Using model=${model}, temperature=${temperature}, maxTokens=${maxTokens}`);
    
    // Prepare the system message with context if provided
    const systemContent = body.context 
      ? `You are a helpful assistant. Context: ${body.context}`
      : 'You are a helpful assistant.';
    
    // Prepare the chat completion options
    const options = {
      model,
      messages: [
        { role: 'system' as const, content: systemContent },
        { role: 'user' as const, content: body.userMessage }
      ],
      temperature,
      max_tokens: maxTokens
    };
    
    console.log('🔍 API: Calling OpenRouter service with options:', JSON.stringify(options));
    
    // Get the chat completion from OpenRouter
    try {
      const response = await openRouterService.getChatCompletion(options);
      console.log('✅ API: Successfully received response from OpenRouter');
      
      // Extract the assistant's reply
      const assistantMessage = response.choices[0]?.message?.content;
      
      if (!assistantMessage) {
        console.log('❌ API: No response generated from OpenRouter');
        return new Response(
          JSON.stringify({ error: 'No response generated' }), 
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Prepare and return the chat response
      const chatResponse: ChatResponse = {
        reply: assistantMessage,
        model: response.model,
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      };
      
      console.log('✅ API: Returning successful response to client');
      
      return new Response(
        JSON.stringify(chatResponse), 
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (innerError) {
      console.error('❌ API: Error calling OpenRouter service:', innerError);
      throw innerError; // Re-throw to be caught by outer catch block
    }
    
  } catch (error: unknown) {
    console.error('❌ API: Chat API Error:', error);
    
    // Handle specific error types with appropriate HTTP status codes
    if (error instanceof ValidationError) {
      console.log('❌ API: Validation Error:', error.message);
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    } else if (error instanceof AuthenticationError) {
      console.log('❌ API: Authentication Error:', error.message);
      // Don't expose API key issues directly to clients
      return new Response(
        JSON.stringify({ error: 'Internal configuration error' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    } else if (error instanceof RateLimitError) {
      console.log('❌ API: Rate Limit Error:', error.message);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }), 
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // Generic error handler for other types of errors
      console.log('❌ API: Generic Error:', error instanceof Error ? error.message : 'Unknown error');
      return new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
}; 