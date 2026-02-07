import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function PageLoadingIndicator() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    const startLoading = () => {
      setIsLoading(true);
      setProgress(0);

      // Simulate progress
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 30;
        });
      }, 200);

      // Complete loading after a short delay
      timeout = setTimeout(() => {
        setProgress(100);
        clearInterval(progressInterval);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 200);
      }, 600);
    };

    startLoading();

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [location.pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-primary/10 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary via-purple-500 to-primary transition-all duration-300 ease-out"
          style={{
            width: `${Math.min(progress, 100)}%`,
            transition: 'width 150ms ease-out',
          }}
        />
      </div>
    </div>
  );
}
