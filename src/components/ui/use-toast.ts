import { useState, useEffect } from 'react';

// Simple implementation of a useToast hook for notifications
export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  // Auto-dismiss toasts after their duration
  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = setTimeout(() => {
      setToasts((prevToasts) => prevToasts.slice(1));
    }, toasts[0].duration || 3000);

    return () => clearTimeout(timer);
  }, [toasts]);

  const toast = (props: ToastProps) => {
    setToasts((prevToasts) => [...prevToasts, { ...props, duration: props.duration || 3000 }]);
  };

  return { toast, toasts };
} 