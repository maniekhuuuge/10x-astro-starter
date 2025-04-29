import React, { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import CharacterCounter from './CharacterCounter';
import ValidationMessage from './ValidationMessage';
import SubmitButton from './SubmitButton';
import ProgressIndicator from './ProgressIndicator';
import { AVAILABLE_MODELS, getDefaultModel } from '../../utils/model-config';
import type { AIModel } from '../../utils/model-config';

// Interfejsy dla formularza
interface AIGenerationData {
  input: string;
  model: string;
}

interface AIGenerationValidation {
  input: string | null;
}

interface AIGenerationInputProps {
  onSubmit: (data: AIGenerationData) => void;
  isLoading: boolean;
  generationStatus: string | null;
}

const AIGenerationInput: React.FC<AIGenerationInputProps> = ({ 
  onSubmit, 
  isLoading, 
  generationStatus 
}) => {
  // Stan dla wartości wejściowej
  const [inputValue, setInputValue] = useState('');
  
  // Stan dla wybranego modelu
  const [selectedModel, setSelectedModel] = useState<string>(getDefaultModel().id);
  
  // Stan dla błędu walidacji
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Stan dla walidacji formularza
  const [isFormValid, setIsFormValid] = useState(false);

  // Limit znaków
  const INPUT_MAX_LENGTH = 10000;

  // Funkcja walidująca pole wejściowe
  const validateInput = (value: string): string | null => {
    if (!value.trim()) {
      return 'To pole jest wymagane';
    }

    if (value.length > INPUT_MAX_LENGTH) {
      return `Maksymalna długość to ${INPUT_MAX_LENGTH} znaków`;
    }

    return null;
  };

  // Obsługa zmiany pola
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setInputValue(value);

    // Walidacja w czasie rzeczywistym
    const error = validateInput(value);
    setValidationError(error);
  };
  
  // Obsługa zmiany modelu
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
  };

  // Aktualizacja stanu walidacji formularza
  useEffect(() => {
    setIsFormValid(!validationError && inputValue.trim() !== '');
  }, [inputValue, validationError]);

  // Obsługa wysłania formularza
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Dodatkowa walidacja przed wysłaniem
    const error = validateInput(inputValue);
    if (error) {
      setValidationError(error);
      return;
    }

    onSubmit({ 
      input: inputValue,
      model: selectedModel
    });
  };
  
  // Pobierz informacje o obecnie wybranym modelu
  const getCurrentModel = (): AIModel | undefined => {
    return AVAILABLE_MODELS.find(model => model.id === selectedModel);
  };
  
  // Renderuj wskaźnik kosztu
  const renderCostIndicator = (costTier: 'low' | 'medium' | 'high') => {
    const colors = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-red-500'
    };
    
    return (
      <div className="flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full ${colors[costTier]}`}></span>
        <span className="text-xs text-muted-foreground capitalize">{costTier} cost</span>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 transition-all duration-200">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label htmlFor="input" className="text-base font-medium">Wprowadź tekst do przetworzenia przez AI</Label>
          <CharacterCounter 
            current={inputValue.length} 
            max={INPUT_MAX_LENGTH} 
          />
        </div>
        <Textarea
          id="input"
          name="input"
          value={inputValue}
          onChange={handleChange}
          placeholder="Wklej tutaj tekst, który chcesz przekształcić w fiszki (maks. 10 000 znaków)"
          className={`min-h-[200px] sm:min-h-[300px] focus:border-primary focus:ring-1 focus:ring-primary ${validationError ? 'border-destructive' : ''}`}
          rows={10}
        />
        <ValidationMessage message={validationError} />
        
        {/* Model Selection */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="model-select" className="text-base font-medium">Model AI</Label>
            <div className="h-4 w-4 text-muted-foreground cursor-help flex items-center justify-center text-xs font-bold border border-muted-foreground rounded-full" title="Różne modele mają różne możliwości i koszty. GPT-4o jest zalecanym modelem oferującym dobry stosunek jakości do ceny.">?</div>
          </div>
          
          <Select 
            value={selectedModel} 
            onValueChange={handleModelChange}
          >
            <SelectTrigger id="model-select" className="w-full">
              <SelectValue placeholder="Wybierz model AI" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id} className="py-2">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                      <span>{model.name}</span>
                      {renderCostIndicator(model.costTier)}
                      {model.isRecommended && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Zalecany</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{model.description}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 p-4 border border-muted-foreground/20 bg-muted/20 rounded-md">
          <h3 className="text-sm font-medium mb-2">Wskazówki:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Tekst zostanie przeanalizowany przez AI, która utworzy fiszki na jego podstawie</li>
            <li>• Dla najlepszych wyników używaj tekstu o strukturze edukacyjnej</li>
            <li>• Wybierz model AI odpowiedni do złożoności twojego tekstu</li>
            <li>• Przetworzenie dłuższych tekstów może zająć więcej czasu</li>
          </ul>
        </div>
        
        <ProgressIndicator status={generationStatus} />
      </div>

      <div className="flex justify-end pt-2">
        <SubmitButton
          isLoading={isLoading}
          isDisabled={!isFormValid}
        >
          Generuj fiszki
        </SubmitButton>
      </div>
    </form>
  );
};

export default AIGenerationInput; 