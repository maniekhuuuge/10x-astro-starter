import React, { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import CharacterCounter from './CharacterCounter';
import ValidationMessage from './ValidationMessage';
import SubmitButton from './SubmitButton';

// Interfejsy dla formularza
interface FlashcardFormData {
  front: string;
  back: string;
}

interface FlashcardFormValidation {
  front: string | null;
  back: string | null;
}

interface FlashcardFormProps {
  onSubmit: (data: FlashcardFormData) => void;
  isLoading: boolean;
}

const FlashcardForm: React.FC<FlashcardFormProps> = ({ onSubmit, isLoading }) => {
  // Stan formularza
  const [formData, setFormData] = useState<FlashcardFormData>({
    front: '',
    back: ''
  });

  // Stan walidacji
  const [validationErrors, setValidationErrors] = useState<FlashcardFormValidation>({
    front: null,
    back: null
  });
  
  // Stan walidacji całego formularza
  const [isFormValid, setIsFormValid] = useState(false);

  // Limity znaków
  const FRONT_MAX_LENGTH = 200;
  const BACK_MAX_LENGTH = 500;

  // Funkcja walidująca pole
  const validateField = (name: keyof FlashcardFormData, value: string): string | null => {
    if (!value.trim()) {
      return 'To pole jest wymagane';
    }

    if (name === 'front' && value.length > FRONT_MAX_LENGTH) {
      return `Maksymalna długość to ${FRONT_MAX_LENGTH} znaków`;
    }

    if (name === 'back' && value.length > BACK_MAX_LENGTH) {
      return `Maksymalna długość to ${BACK_MAX_LENGTH} znaków`;
    }

    return null;
  };

  // Obsługa zmiany pola
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Walidacja w czasie rzeczywistym
    const error = validateField(name as keyof FlashcardFormData, value);
    setValidationErrors((prev) => ({
      ...prev,
      [name]: error
    }));
  };

  // Walidacja całego formularza
  useEffect(() => {
    const isFrontValid = !validationErrors.front && formData.front.trim() !== '';
    const isBackValid = !validationErrors.back && formData.back.trim() !== '';
    
    setIsFormValid(isFrontValid && isBackValid);
  }, [formData, validationErrors]);

  // Obsługa wysłania formularza
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Dodatkowa walidacja przed wysłaniem
    const frontError = validateField('front', formData.front);
    const backError = validateField('back', formData.back);

    if (frontError || backError) {
      setValidationErrors({
        front: frontError,
        back: backError
      });
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 transition-all duration-200">
      {/* Pole "Przód" */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="front" className="text-base font-medium">Przód</Label>
          <CharacterCounter 
            current={formData.front.length} 
            max={FRONT_MAX_LENGTH} 
          />
        </div>
        <Input
          id="front"
          name="front"
          value={formData.front}
          onChange={handleChange}
          placeholder="Wpisz tekst z przodu fiszki"
          className={`focus:border-primary focus:ring-1 focus:ring-primary ${validationErrors.front ? 'border-destructive' : ''}`}
        />
        <ValidationMessage message={validationErrors.front} />
      </div>

      {/* Pole "Tył" */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="back" className="text-base font-medium">Tył</Label>
          <CharacterCounter 
            current={formData.back.length} 
            max={BACK_MAX_LENGTH} 
          />
        </div>
        <Textarea
          id="back"
          name="back"
          value={formData.back}
          onChange={handleChange}
          placeholder="Wpisz tekst z tyłu fiszki"
          className={`min-h-[150px] sm:min-h-[200px] focus:border-primary focus:ring-1 focus:ring-primary ${validationErrors.back ? 'border-destructive' : ''}`}
          rows={5}
        />
        <ValidationMessage message={validationErrors.back} />
      </div>

      {/* Przycisk submit */}
      <div className="flex justify-end pt-2">
        <SubmitButton
          isLoading={isLoading}
          isDisabled={!isFormValid}
        >
          Zapisz fiszkę
        </SubmitButton>
      </div>
    </form>
  );
};

export default FlashcardForm; 