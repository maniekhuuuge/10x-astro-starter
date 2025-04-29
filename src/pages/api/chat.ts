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
  // Initialize the OpenRouter service
  const openRouterService = new OpenRouterService();
  
  try {
    // Parse the request body
    const body = await request.json() as ChatRequest;
    
    // Validate required fields
    if (!body.userMessage) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: userMessage' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Set default values if not provided
    const model = body.model || 'openai/gpt-4o';
    const temperature = body.temperature ?? 0.7;
    const maxTokens = body.maxTokens ?? 1000;
    
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
    
    // Get the chat completion from OpenRouter
    const response = await openRouterService.getChatCompletion(options);
    
    // Extract the assistant's reply
    const assistantMessage = response.choices[0]?.message?.content;
    
    if (!assistantMessage) {
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
    
    return new Response(
      JSON.stringify(chatResponse), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    
    // Handle specific error types with appropriate HTTP status codes
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    } else if (error instanceof AuthenticationError) {
      // Don't expose API key issues directly to clients
      return new Response(
        JSON.stringify({ error: 'Internal configuration error' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    } else if (error instanceof RateLimitError) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }), 
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      // Generic error handler for other types of errors
      return new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
}; 