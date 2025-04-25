interface CardFrontProps {
  text: string;
}

const CardFront = ({ text }: CardFrontProps) => {
  return (
    <div className="text-xl font-medium">
      {text}
    </div>
  );
};

export default CardFront; 