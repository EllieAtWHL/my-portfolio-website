import React from 'react';

interface SpursWrapperProps {
  children: React.ReactNode;
}

export function SpursWrapper({ children }: SpursWrapperProps) {
  return (
    <div className="spurs-wrapper min-h-screen">
      {children}
    </div>
  );
}
