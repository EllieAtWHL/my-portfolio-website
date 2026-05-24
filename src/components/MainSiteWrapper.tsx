import React from 'react';

interface MainSiteWrapperProps {
  children: React.ReactNode;
}

export function MainSiteWrapper({ children }: MainSiteWrapperProps) {
  return (
    <div className="main-wrapper">
      {children}
    </div>
  );
}
