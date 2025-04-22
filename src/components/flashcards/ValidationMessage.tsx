import React from 'react';

interface ValidationMessageProps {
  message: string | null;
}

const ValidationMessage: React.FC<ValidationMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <p className="text-sm font-medium text-destructive mt-1">
      {message}
    </p>
  );
};

export default ValidationMessage; 