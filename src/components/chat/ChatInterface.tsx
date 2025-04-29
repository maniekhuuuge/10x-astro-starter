import { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Spinner } from '../ui/spinner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatApiResponse {
  reply: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState('');
  const [model, setModel] = useState('openai/gpt-4o');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    
    // Clear input
    setInput('');
    
    // Set loading state
    setIsLoading(true);
    setError(null);
    
    try {
      // Call our API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: userMessage.content,
          context: context || undefined,
          model,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get a response');
      }
      
      const data: ChatApiResponse = await response.json();
      
      // Add assistant response to chat
      setMessages((prev) => [
        ...prev, 
        { role: 'assistant', content: data.reply }
      ]);
      
      // Log token usage
      console.log(`Token usage: ${data.promptTokens} prompt + ${data.completionTokens} completion = ${data.totalTokens} total`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 w-full max-w-2xl mx-auto p-4">
      <div className="flex flex-col space-y-2">
        <label htmlFor="model" className="text-sm font-medium">
          Model
        </label>
        <Input
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="openai/gpt-4o"
        />
      </div>
      
      <div className="flex flex-col space-y-2">
        <label htmlFor="context" className="text-sm font-medium">
          Context (Optional)
        </label>
        <Input
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Additional context for the assistant..."
        />
      </div>
      
      <div className="border rounded-md p-4 h-96 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 h-full flex items-center justify-center">
            <p>Send a message to start chatting with the AI</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-100 dark:bg-blue-900 ml-8'
                    : 'bg-gray-100 dark:bg-gray-800 mr-8'
                }`}
              >
                <p className="text-sm font-semibold mb-1">
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </p>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {error && (
        <div className="p-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="resize-none"
          rows={3}
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
          {isLoading ? 'Sending...' : 'Send Message'}
        </Button>
      </form>
    </div>
  );
} 