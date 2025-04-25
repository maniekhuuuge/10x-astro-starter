interface MessageDisplayProps {
  message: string;
  children?: React.ReactNode;
}

const MessageDisplay = ({ message, children }: MessageDisplayProps) => {
  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center">
      <div className="bg-muted p-8 rounded-lg">
        <p className="text-xl mb-6">{message}</p>
        {children}
      </div>
    </div>
  );
};

export default MessageDisplay; 