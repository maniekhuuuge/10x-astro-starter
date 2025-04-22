import React from 'react';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps {
  isLoading: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  type?: 'submit' | 'button';
  children: React.ReactNode;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  isLoading,
  isDisabled = false,
  onClick,
  type = 'submit',
  children
}) => {
  return (
    <Button
      type={type}
      disabled={isLoading || isDisabled}
      onClick={onClick}
      className="w-full sm:w-auto"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Przetwarzanie...
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default SubmitButton; 