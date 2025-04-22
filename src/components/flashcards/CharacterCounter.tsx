import React from 'react';

interface CharacterCounterProps {
  current: number;
  max: number;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({ current, max }) => {
  const isOverLimit = current > max;

  return (
    <span 
      className={`text-xs transition-colors ${
        isOverLimit 
          ? 'text-destructive font-medium' 
          : 'text-muted-foreground'
      }`}
    >
      {current}/{max}
    </span>
  );
};

export default CharacterCounter; 