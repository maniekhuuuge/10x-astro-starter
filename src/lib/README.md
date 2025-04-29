# OpenRouter Service

This service provides an easy way to interact with the [OpenRouter API](https://openrouter.ai/) to access various language models (LLMs) like GPT-4o, Claude, and others.

## Setup

1. Get your API key from [OpenRouter](https://openrouter.ai/keys)
2. Add your API key to the `.env` file in the project root:

```
OPENROUTER_API_KEY=your_api_key_here
APP_URL=your_app_url_here  # optional, defaults to http://localhost:3000
APP_TITLE=your_app_title   # optional, defaults to 10x App
```

## Basic Usage

Import the service and create a new instance:

```typescript
import { OpenRouterService } from '../lib/openrouter.service';

const openRouterService = new OpenRouterService();
```

### Simple Chat Completion

```typescript
const response = await openRouterService.getChatCompletion({
  model: 'openai/gpt-4o',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' }
  ],
  temperature: 0.7,
  max_tokens: 500
});

console.log(response.choices[0].message.content);
// "The capital of France is Paris."
```

### Structured JSON Responses

You can request structured responses by providing a JSON schema:

```typescript
const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Full name of the user' },
    age: { type: 'integer', description: 'Age in years' },
    interests: { 
      type: 'array', 
      items: { type: 'string' },
      description: 'List of user interests' 
    }
  },
  required: ['name']
};

const response = await openRouterService.getChatCompletion({
  model: 'openai/gpt-4o',
  messages: [
    { 
      role: 'system', 
      content: 'Extract user information from the text.' 
    },
    { 
      role: 'user', 
      content: 'My name is John Smith, I am 28 years old and I enjoy hiking, coding, and playing guitar.' 
    }
  ],
  temperature: 0.2,
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'userInfoExtractor',
      strict: true,
      schema: userSchema
    }
  }
});

const userInfo = JSON.parse(response.choices[0].message.content);
// {
//   "name": "John Smith",
//   "age": 28,
//   "interests": ["hiking", "coding", "playing guitar"]
// }
```

## Error Handling

The service throws various types of errors that you should handle in your application:

```typescript
try {
  const response = await openRouterService.getChatCompletion(options);
  // Process the response
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation errors (e.g., missing required fields)
  } else if (error instanceof AuthenticationError) {
    // Handle authentication errors (e.g., invalid API key)
  } else if (error instanceof RateLimitError) {
    // Handle rate limit exceeded errors
  } else if (error instanceof ServerError) {
    // Handle server errors from OpenRouter
  } else if (error instanceof NetworkError) {
    // Handle network connectivity issues
  } else if (error instanceof ParsingError) {
    // Handle response parsing errors
  } else {
    // Handle other errors
  }
}
```

## API Reference

See the [OpenRouter API Documentation](https://openrouter.ai/docs) for more details on the available models and parameters.

## Examples

Check the API endpoints in `src/pages/api/` for examples of how to use the OpenRouterService:

- `chat.ts` - Simple chat completion endpoint
- `extract-info.ts` - Example of using JSON schema for structured responses 