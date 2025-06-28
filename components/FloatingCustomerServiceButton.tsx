'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import { useChatwoot } from '@/lib/hooks/useChatwoot';
import { cn } from '@/lib/utils';

export const FloatingCustomerServiceButton = () => {
  const { isLoaded, isOpen, toggle } = useChatwoot();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Show button after a short delay to ensure smooth page load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (isLoaded) {
      toggle();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 right-6 z-50">
      <Button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "group relative h-14 w-14 rounded-full shadow-lg transition-all duration-300 ease-in-out",
          "bg-blue-600 hover:bg-blue-700 text-white",
          "hover:scale-110 hover:shadow-xl",
          "focus:outline-none focus:ring-4 focus:ring-blue-500/50",
          isOpen && "bg-red-600 hover:bg-red-700"
        )}
        size="sm"
        disabled={!isLoaded}
      >
        <div className="relative flex items-center justify-center">
          {isOpen ? (
            <X className="h-6 w-6 transition-transform duration-200" />
          ) : (
            <MessageCircle className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" />
          )}
          
          {/* Pulse animation when not opened */}
          {!isOpen && (
            <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20" />
          )}
        </div>

        {/* Tooltip */}
        <div
          className={cn(
            "absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg",
            "transition-all duration-200 whitespace-nowrap",
            "pointer-events-none",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          )}
        >
          {isOpen ? 'Close Chat' : 'Customer Support'}
          <div className="absolute top-full right-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      </Button>

      {/* Status indicator */}
      <div
        className={cn(
          "absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white transition-colors duration-200",
          isLoaded ? "bg-green-500" : "bg-gray-400"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-opacity duration-1000",
            isLoaded && "bg-green-500 animate-pulse opacity-60"
          )}
        />
      </div>
    </div>
  );
}; 