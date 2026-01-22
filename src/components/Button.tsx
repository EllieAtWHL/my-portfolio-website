import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'spurs';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    icon, 
    iconPosition = 'left',
    fullWidth = false,
    asChild = false,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = 'button transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variantClasses = {
      primary: 'button primary',
      secondary: 'button secondary',
      ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800',
      spurs: 'spurs-button'
    };
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };
    
    const widthClasses = fullWidth ? 'w-full' : '';
    const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';
    
    const buttonClasses = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      widthClasses,
      disabledClasses,
      className
    );

    const renderIcon = () => {
      if (!icon) return null;
      return (
        <span className={cn('flex-shrink-0', iconPosition === 'left' ? 'mr-2' : 'ml-2')}>
          {icon}
        </span>
      );
    };

    const renderContent = () => {
      if (loading) {
        return (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            {children}
          </>
        );
      }

      return (
        <>
          {iconPosition === 'left' && renderIcon()}
          {children}
          {iconPosition === 'right' && renderIcon()}
        </>
      );
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(buttonClasses, (children.props as any).className),
        ref,
        disabled: disabled || loading,
        ...props,
      });
    }

    return (
      <button
        className={buttonClasses}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {renderContent()}
      </button>
    );
  }
);

Button.displayName = 'Button';
