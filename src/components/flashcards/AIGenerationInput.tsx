import React, { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import CharacterCounter from './CharacterCounter';
import ValidationMessage from './ValidationMessage';
import SubmitButton from './SubmitButton';
import ProgressIndicator from './ProgressIndicator';

// Interfejsy dla formularza
interface AIGenerationData {
  input: string;
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

    onSubmit({ input: inputValue });
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

        <div className="mt-4 p-4 border border-muted-foreground/20 bg-muted/20 rounded-md">
          <h3 className="text-sm font-medium mb-2">Wskazówki:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Tekst zostanie przeanalizowany przez AI, która utworzy fiszki na jego podstawie</li>
            <li>• Dla najlepszych wyników używaj tekstu o strukturze edukacyjnej</li>
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