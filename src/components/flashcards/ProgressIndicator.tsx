import React from 'react';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ProgressIndicatorProps {
  status: 'idle' | 'loading' | 'success' | 'error' | 'timeout' | string | null;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ status }) => {
  if (!status || status === 'idle') return null;

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            <span>Generowanie fiszek...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>Fiszki zostały wygenerowane!</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center text-destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Błąd podczas generowania fiszek</span>
          </div>
        );
      case 'timeout':
        return (
          <div className="flex items-center text-yellow-600">
            <Clock className="h-4 w-4 mr-2" />
            <span>Przekroczono limit czasu. Spróbuj z krótszym tekstem.</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-muted-foreground">
            <span>{status}</span>
          </div>
        );
    }
  };

  return (
    <div className="mt-2">
      {getStatusContent()}
    </div>
  );
};

export default ProgressIndicator; 