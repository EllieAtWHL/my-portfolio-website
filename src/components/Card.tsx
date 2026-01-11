'use client';

import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'highlight' | 'bordered' | 'accent';
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'md',
  hover = true,
  onClick 
}: CardProps) {
  const baseClasses = 'transition-all duration-300 w-full max-w-full box-border';
  
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 shadow-lg',
    highlight: 'highlight',
    bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-lg',
    accent: 'accent-card'
  };
  
  const paddingClasses = {
    sm: variant === 'accent' ? '!pt-4 !pr-4 !pb-4 !pl-8' : 'p-4',
    md: variant === 'accent' ? '!pt-6 !pr-6 !pb-6 !pl-8' : 'p-6',
    lg: variant === 'accent' ? '!pt-8 !pr-8 !pb-8 !pl-8' : 'p-8'
  };
  
  const hoverClasses = hover ? 'hover:shadow-xl hover:-translate-y-1' : '';
  const interactiveClasses = onClick ? 'cursor-pointer' : '';
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    hoverClasses,
    interactiveClasses,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div 
      className={`rounded-xl ${classes}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
