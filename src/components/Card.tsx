'use client';

import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'highlight' | 'bordered' | 'accent' | 'spursAccent';
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export function Card({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'md',
  hover = true,
  clickable = false,
  onClick 
}: CardProps) {
  const baseClasses = 'transition-all duration-300 w-full max-w-full box-border';
  
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 shadow-lg',
    highlight: 'highlight',
    bordered: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-lg',
    accent: 'accent-card',
    spursAccent: 'spurs-accent-card'
  };
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const hoverClasses = (hover && clickable) ? 'hover:shadow-xl hover:-translate-y-1 hover-enabled' : 'no-hover';
  const interactiveClasses = (clickable || onClick) ? 'cursor-pointer' : '';
  
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
