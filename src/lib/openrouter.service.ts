// Types for the OpenRouter service
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface JsonSchemaFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict?: boolean;
    schema: object;
  }
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  response_format?: JsonSchemaFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface ChatCompletionChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: ChatCompletionUsage;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

// Custom error classes
export class OpenRouterApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'OpenRouterApiError';
    this.status = status;
  }
}

export class AuthenticationError extends OpenRouterApiError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class BadRequestError extends OpenRouterApiError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

export class RateLimitError extends OpenRouterApiError {
  constructor(message: string) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export class ServerError extends OpenRouterApiError {
  constructor(message: string) {
    super(message, 500);
    this.name = 'ServerError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParsingError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * OpenRouter Service - provides an interface to communicate with OpenRouter API
 * to access various language models like GPT-4, Claude, etc.
 */
export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  private appReferer: string;
  private appTitle: string;

  /**
   * Creates an instance of OpenRouterService.
   * Loads API key and app metadata from environment variables.
   * @throws {Error} If OpenRouter API key is not configured
   */
  constructor() {
    console.log('🔄 OpenRouterService: Constructor called');
    
    // Log all environment variables (excluding sensitive values)
    console.log('🔄 OpenRouterService: Environment variables check');
    console.log('OPENROUTER_API_KEY present:', !!import.meta.env.OPENROUTER_API_KEY);
    console.log('PUBLIC_OPENROUTER_API_KEY present:', !!import.meta.env.PUBLIC_OPENROUTER_API_KEY);
    console.log('APP_URL present:', !!import.meta.env.APP_URL);
    console.log('PUBLIC_APP_URL present:', !!import.meta.env.PUBLIC_APP_URL);
    console.log('APP_TITLE present:', !!import.meta.env.APP_TITLE);
    console.log('PUBLIC_APP_TITLE present:', !!import.meta.env.PUBLIC_APP_TITLE);
    
    // In Astro, we need to use import.meta.env pattern for environment variables
    const apiKey = import.meta.env.OPENROUTER_API_KEY || 
                   import.meta.env.PUBLIC_OPENROUTER_API_KEY;
                   
    const referer = import.meta.env.APP_URL || 
                    import.meta.env.PUBLIC_APP_URL || 
                    'http://localhost:3000';
                    
    const title = import.meta.env.APP_TITLE || 
                  import.meta.env.PUBLIC_APP_TITLE || 
                  '10x App';

    if (!apiKey) {
      console.error('❌ OpenRouterService: API key not found in environment variables');
      throw new Error('OpenRouter API key is not configured. Please add OPENROUTER_API_KEY to your .env file.');
    }

    console.log('✅ OpenRouterService: API Key available:', !!apiKey);
    console.log('✅ OpenRouterService: Using referer:', referer);
    console.log('✅ OpenRouterService: Using title:', title);

    this.apiKey = apiKey;
    this.appReferer = referer;
    this.appTitle = title;
  }

  /**
   * Sends a chat completion request to OpenRouter API
   * @param options Chat completion options including model, messages, and other parameters
   * @returns Chat completion response with generated content
   * @throws {ValidationError} If required parameters are missing
   * @throws {AuthenticationError} If API authentication fails
   * @throws {BadRequestError} If request parameters are invalid
   * @throws {RateLimitError} If rate limits are exceeded
   * @throws {ServerError} If OpenRouter server returns an error
   * @throws {NetworkError} If network connection fails
   * @throws {ParsingError} If response parsing fails
   */
  public async getChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    // Validate input
    if (!options.model) {
      throw new ValidationError('Model is required');
    }
    
    if (!options.messages || options.messages.length === 0) {
      throw new ValidationError('At least one message is required');
    }

    console.log(`🔄 OpenRouter: Sending request to model ${options.model} with ${options.messages.length} messages`);
    
    // Prepare request body
    const body = {
      model: options.model,
      messages: options.messages,
      ...(options.response_format && { response_format: options.response_format }),
      ...(options.temperature !== undefined && { temperature: options.temperature }),
      ...(options.max_tokens !== undefined && { max_tokens: options.max_tokens }),
      ...(options.top_p !== undefined && { top_p: options.top_p }),
      ...(options.frequency_penalty !== undefined && { frequency_penalty: options.frequency_penalty }),
      ...(options.presence_penalty !== undefined && { presence_penalty: options.presence_penalty })
    };

    console.log(`🔍 OpenRouter: Request configuration: model=${options.model}, temperature=${options.temperature || 'default'}, response_format=${options.response_format ? 'defined' : 'undefined'}`);

    try {
      // Send request to OpenRouter API
      console.log('📤 OpenRouter: Sending request to API');
      const response = await this._request('/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      console.log(`📥 OpenRouter: Received response with status: ${response.status}`);
      
      // Handle response
      return this._handleApiResponse<ChatCompletionResponse>(response);
    } catch (error) {
      // Re-throw custom errors
      if (error instanceof OpenRouterApiError || 
          error instanceof ValidationError ||
          error instanceof NetworkError ||
          error instanceof ParsingError) {
        console.error(`❌ OpenRouter Error (${error.name}): ${error.message}`);
        throw error;
      }
      
      // Handle other errors
      console.error(`❌ OpenRouter Unexpected Error: ${(error as Error).message}`);
      throw new Error(`Failed to get chat completion: ${(error as Error).message}`);
    }
  }

  /**
   * Sends HTTP request to OpenRouter API
   * @param endpoint API endpoint
   * @param options Request options
   * @returns API response
   * @throws {NetworkError} If network connection fails
   */
  private async _request(endpoint: string, options: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Add authorization and other required headers
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.apiKey}`,
      'HTTP-Referer': this.appReferer,
      'X-Title': this.appTitle
    };

    console.log('🔄 OpenRouter Request: Endpoint:', endpoint);
    console.log('🔄 OpenRouter Request: Headers (excluding auth):', {
      ...headers,
      'Authorization': this.apiKey ? 'Bearer [REDACTED]' : 'MISSING API KEY'
    });
    
    try {
      // Perform fetch with retry logic
      console.log('🔄 OpenRouter Request: Sending request to:', url);
      return await this._fetchWithRetry(url, { ...options, headers });
    } catch (error) {
      console.error('❌ OpenRouter Request: Network error:', error);
      if (error instanceof TypeError || error instanceof Error) {
        throw new NetworkError(`Network error while connecting to OpenRouter API: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Handles API response, checking for errors and parsing JSON
   * @param response API response
   * @returns Parsed API response
   * @throws {AuthenticationError} If API returns 401
   * @throws {BadRequestError} If API returns 400
   * @throws {RateLimitError} If API returns 429
   * @throws {ServerError} If API returns 5xx
   * @throws {OpenRouterApiError} For other API errors
   * @throws {ParsingError} If response parsing fails
   */
  private async _handleApiResponse<T>(response: Response): Promise<T> {
    console.log('🔄 OpenRouter Response: Status code:', response.status);
    
    try {
      const responseData = await response.json() as any;
      
      // Log the first 500 chars of the response for debugging
      console.log('🔄 OpenRouter Response: First 500 chars:', JSON.stringify(responseData).substring(0, 500));
      
      // Check for error object even when status is 200
      if (responseData.error) {
        console.error(`❌ OpenRouter Response: Error in response with status ${response.status}:`, responseData.error);
        
        // Handle payment/credit limits (usually code 402)
        // Check for various forms of token limit errors
        if (responseData.error.code === 402 || 
            (responseData.error.message && 
             (responseData.error.message.includes('more credits') || 
              responseData.error.message.includes('can only afford') ||
              responseData.error.message.includes('token limit')))) {
          console.error('❌ OpenRouter Response: Credit limit exceeded:', responseData.error.message);
          throw new RateLimitError(`Credit limit exceeded: ${responseData.error.message}`);
        }
        
        // Check for authentication errors
        if (responseData.error.code === 401 || 
            responseData.error.type === 'invalid_request_error' || 
            (responseData.error.message && 
             (responseData.error.message.includes('API key') || 
              responseData.error.message.includes('authentication') ||
              responseData.error.message.includes('authorized')))) {
          console.error('❌ OpenRouter Response: Authentication error:', responseData.error.message);
          throw new AuthenticationError(`Authentication error: ${responseData.error.message}`);
        }
        
        // Handle other errors embedded in a 200 response
        throw new OpenRouterApiError(
          responseData.error.message || 'Unknown API error', 
          responseData.error.code || 400
        );
      }
      
      console.log('✅ OpenRouter Response: Successfully parsed API response');
      
      // Validate the response structure for chat completion
      if (this.isChatCompletionResponse(responseData)) {
        // Validate that the response has the required structure
        if (!responseData.choices || !Array.isArray(responseData.choices) || responseData.choices.length === 0) {
          console.error('❌ OpenRouter Response: Invalid response structure - missing choices array');
          throw new ParsingError('Invalid response structure: missing choices array');
        }
        
        const firstChoice = responseData.choices[0];
        if (!firstChoice || typeof firstChoice !== 'object') {
          console.error('❌ OpenRouter Response: Invalid response structure - first choice is invalid');
          throw new ParsingError('Invalid response structure: first choice is invalid');
        }
        
        if (!firstChoice.message || typeof firstChoice.message !== 'object') {
          console.error('❌ OpenRouter Response: Invalid response structure - message is missing or invalid');
          throw new ParsingError('Invalid response structure: message is missing or invalid');
        }
        
        if (typeof firstChoice.message.content !== 'string') {
          console.error('❌ OpenRouter Response: Invalid response structure - content is not a string');
          throw new ParsingError('Invalid response structure: content is not a string');
        }
        
        console.log('✅ OpenRouter Response: Response structure validation passed');
      }
      
      return responseData as T;
    } catch (error) {
      console.error('❌ OpenRouter Response: Failed to parse or validate API response', error);
      
      // Check for non-JSON responses (usually auth errors)
      if (error instanceof SyntaxError && response.status === 401) {
        console.error('❌ OpenRouter Response: Authentication error (non-JSON response)');
        throw new AuthenticationError('Authentication failed: Invalid API key');
      }
      
      // Re-throw RateLimitError or OpenRouterApiError
      if (error instanceof RateLimitError || error instanceof OpenRouterApiError) {
        throw error;
      }
      
      // Check HTTP status code for common errors
      if (response.status === 401) {
        console.error('❌ OpenRouter Response: Authentication error (status 401)');
        throw new AuthenticationError('Authentication failed: Invalid API key');
      } else if (response.status === 429) {
        console.error('❌ OpenRouter Response: Rate limit exceeded (status 429)');
        throw new RateLimitError('Rate limit exceeded');
      } else if (response.status >= 500) {
        console.error('❌ OpenRouter Response: Server error (status 5xx)');
        throw new ServerError('OpenRouter server error');
      }
      
      throw new ParsingError(`Failed to parse API response: ${(error as Error).message}`);
    }
  }
  
  /**
   * Type guard to check if response is a ChatCompletionResponse
   */
  private isChatCompletionResponse(obj: any): obj is ChatCompletionResponse {
    return (
      obj && 
      typeof obj === 'object' && 
      'choices' in obj
    );
  }

  /**
   * Fetches with retry logic for transient errors
   * @param url API URL
   * @param options Request options
   * @param maxRetries Maximum number of retries
   * @param retryCount Current retry count
   * @returns API response
   * @throws {TypeError} If network error persists after max retries
   */
  private async _fetchWithRetry(
    url: string, 
    options: RequestInit, 
    maxRetries: number = 3, 
    retryCount: number = 0
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);
      
      // Only retry on server errors (5xx)
      if (response.status >= 500 && response.status < 600 && retryCount < maxRetries) {
        // Exponential backoff: 2^retryCount * 1000ms + random jitter
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._fetchWithRetry(url, options, maxRetries, retryCount + 1);
      }
      
      return response;
    } catch (error) {
      // Retry network errors
      if (error instanceof TypeError && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this._fetchWithRetry(url, options, maxRetries, retryCount + 1);
      }
      throw error;
    }
  }
} 