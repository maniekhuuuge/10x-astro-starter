import type { APIRoute } from 'astro';
import { OpenRouterService, ValidationError, AuthenticationError, RateLimitError } from '../../lib/openrouter.service';

export interface ExtractInfoRequest {
  text: string;
  model?: string;
  temperature?: number;
}

export interface PersonInfo {
  name: string;
  email?: string;
  phone?: string;
  age?: number; 
  location?: string;
  occupation?: string;
}

/**
 * Information extraction API endpoint
 * 
 * Accepts a POST request with text and optional parameters,
 * then extracts structured information using OpenRouter API with JSON schema.
 * 
 * @example
 * // Request
 * fetch('/api/extract-info', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     text: 'My name is Jane Smith, I am 32 years old and work as a software engineer in Berlin. You can reach me at jane.smith@example.com or +49123456789.'
 *   })
 * })
 * 
 * // Response
 * {
 *   info: {
 *     name: 'Jane Smith',
 *     email: 'jane.smith@example.com',
 *     phone: '+49123456789',
 *     age: 32,
 *     location: 'Berlin',
 *     occupation: 'software engineer'
 *   },
 *   model: 'openai/gpt-4o',
 *   promptTokens: 42,
 *   completionTokens: 35,
 *   totalTokens: 77
 * }
 */
export const POST: APIRoute = async ({ request }) => {
  // Initialize the OpenRouter service
  const openRouterService = new OpenRouterService();
  
  try {
    // Parse the request body
    const body = await request.json() as ExtractInfoRequest;
    
    // Validate required fields
    if (!body.text) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: text' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Set default values if not provided
    const model = body.model || 'openai/gpt-4o';
    const temperature = body.temperature ?? 0.2; // Lower temperature for more deterministic extraction
    
    // Define the JSON schema for person information
    const personInfoSchema = {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Full name of the person' },
        email: { type: 'string', format: 'email', description: 'Email address of the person' },
        phone: { type: 'string', description: 'Phone number of the person' },
        age: { type: 'integer', description: 'Age of the person in years' },
        location: { type: 'string', description: 'Location/city where the person lives or works' },
        occupation: { type: 'string', description: 'Job or profession of the person' }
      },
      required: ['name']
    };
    
    // Prepare the chat completion options with JSON schema response format
    const options = {
      model,
      messages: [
        { 
          role: 'system' as const, 
          content: 'Extract person information from the provided text. Return only the structured data according to the provided schema.' 
        },
        { 
          role: 'user' as const, 
          content: body.text 
        }
      ],
      temperature,
      response_format: {
        type: 'json_schema' as const,
        json_schema: {
          name: 'personInfoExtractor',
          strict: true,
          schema: personInfoSchema
        }
      }
    };
    
    // Get the chat completion from OpenRouter
    const response = await openRouterService.getChatCompletion(options);
    
    // Extract the JSON string from the response
    const jsonString = response.choices[0]?.message?.content;
    
    if (!jsonString) {
      return new Response(
        JSON.stringify({ error: 'No response generated' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse the JSON string into a PersonInfo object
    let personInfo: PersonInfo;
    try {
      personInfo = JSON.parse(jsonString) as PersonInfo;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Failed to parse structured data response' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Prepare and return the response
    return new Response(
      JSON.stringify({
        info: personInfo,
        model: response.model,
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    console.error('Extract Info API Error:', error);
    
    // Handle specific error types with appropriate HTTP status codes
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    } else if (error instanceof AuthenticationError) {
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
      return new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
}; 