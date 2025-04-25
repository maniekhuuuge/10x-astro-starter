interface CardBackProps {
  text: string;
}

const CardBack = ({ text }: CardBackProps) => {
  return (
    <div>
      <h3 className="text-sm uppercase text-muted-foreground mb-2">Odpowiedź:</h3>
      <div className="text-xl">{text}</div>
    </div>
  );
};

export default CardBack; 