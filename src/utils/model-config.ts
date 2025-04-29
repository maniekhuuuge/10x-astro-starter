/**
 * Configuration for AI models available in the application
 */

export interface AIModel {
  id: string;           // OpenRouter model identifier
  name: string;         // Display name for the UI
  description: string;  // Short description of the model
  costTier: 'low' | 'medium' | 'high'; // Relative cost indicator
  isRecommended?: boolean; // Whether this model is recommended for the task
}

/**
 * Models available for flashcard generation
 */
export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'Powerful for understanding context and generating structured content. Good balance of quality and speed.',
    costTier: 'medium',
    isRecommended: true,
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and economical. Good for simpler content but may be less precise for complex topics.',
    costTier: 'low',
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    description: 'Excellent at following detailed instructions and formatting. High-quality outputs but more expensive.',
    costTier: 'high',
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: 'Good balance of quality and cost. Strong at structured content like flashcards.',
    costTier: 'medium',
  },
  {
    id: 'google/gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Good at understanding concepts and generating structured content.',
    costTier: 'medium',
  },
];

/**
 * Get the default model
 */
export const getDefaultModel = (): AIModel => {
  return AVAILABLE_MODELS.find(model => model.isRecommended) || AVAILABLE_MODELS[0];
};

/**
 * Get a model by its ID
 */
export const getModelById = (id: string): AIModel | undefined => {
  return AVAILABLE_MODELS.find(model => model.id === id);
}; 