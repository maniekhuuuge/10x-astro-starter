import { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Spinner } from '../ui/spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface PersonInfo {
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  location?: string;
  occupation?: string;
}

interface ExtractApiResponse {
  info: PersonInfo;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export default function InfoExtractor() {
  const [text, setText] = useState('');
  const [extractedInfo, setExtractedInfo] = useState<PersonInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<{
    prompt: number;
    completion: number;
    total: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setExtractedInfo(null);
    setTokenUsage(null);
    
    try {
      // Call our API endpoint
      const response = await fetch('/api/extract-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          temperature: 0.2, // Lower temperature for more deterministic extraction
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract information');
      }
      
      const data: ExtractApiResponse = await response.json();
      
      // Set the extracted info
      setExtractedInfo(data.info);
      
      // Set token usage
      setTokenUsage({
        prompt: data.promptTokens,
        completion: data.completionTokens,
        total: data.totalTokens,
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Extraction error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 w-full max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Information Extractor</CardTitle>
          <CardDescription>
            Enter text containing personal information and the AI will extract structured data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text containing information about a person. For example: 'My name is Jane Smith, I am 32 years old and work as a software engineer in Berlin. You can reach me at jane.smith@example.com or +49123456789.'"
                className="resize-none"
                rows={5}
                disabled={isLoading}
              />
            </div>
            
            <Button type="submit" disabled={isLoading || !text.trim()}>
              {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {isLoading ? 'Extracting...' : 'Extract Information'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {error && (
        <Card className="border-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}
      
      {extractedInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Information</CardTitle>
            {tokenUsage && (
              <CardDescription>
                Token usage: {tokenUsage.prompt} prompt + {tokenUsage.completion} completion = {tokenUsage.total} total
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="font-semibold">Name</dt>
                <dd>{extractedInfo.name}</dd>
              </div>
              
              {extractedInfo.email && (
                <div>
                  <dt className="font-semibold">Email</dt>
                  <dd>{extractedInfo.email}</dd>
                </div>
              )}
              
              {extractedInfo.phone && (
                <div>
                  <dt className="font-semibold">Phone</dt>
                  <dd>{extractedInfo.phone}</dd>
                </div>
              )}
              
              {extractedInfo.age !== undefined && (
                <div>
                  <dt className="font-semibold">Age</dt>
                  <dd>{extractedInfo.age}</dd>
                </div>
              )}
              
              {extractedInfo.location && (
                <div>
                  <dt className="font-semibold">Location</dt>
                  <dd>{extractedInfo.location}</dd>
                </div>
              )}
              
              {extractedInfo.occupation && (
                <div>
                  <dt className="font-semibold">Occupation</dt>
                  <dd>{extractedInfo.occupation}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 