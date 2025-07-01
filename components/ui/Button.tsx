
import React from 'react';
import { Link, LinkProps } from 'react-router-dom';

// Define props that are common or specific to the button's appearance and behavior
interface CommonButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
}

// Props when rendering as a <button> element
// Includes all standard button attributes except 'className' (handled by CommonButtonProps)
interface HtmlButtonProps extends CommonButtonProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {
  to?: undefined; // Explicitly undefined when it's a button
}

// Props when rendering as a <Link> component
// Includes all LinkProps except 'className' and 'children' (handled by CommonButtonProps)
interface RouterLinkProps extends CommonButtonProps, Omit<LinkProps, 'className' | 'children'> {
  to: string; // 'to' is required for Link
}

// Union type for all possible props
type ButtonProps = HtmlButtonProps | RouterLinkProps;

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  to,
  ...props 
}) => {
  const baseStyles = 'font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';

  const variantStyles = {
    primary: 'bg-hnai-teal-dark hover:bg-hnai-teal-hover text-white focus:ring-hnai-gold',
    secondary: 'bg-slate-200 hover:bg-slate-300 text-slate-800 focus:ring-slate-400', // Consider a HNAI branded secondary
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-hnai-gold/20 text-hnai-teal-dark focus:ring-hnai-teal-focus border border-hnai-teal-dark',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;
  
  const loadingIcon = isLoading && (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  if (to) {
    const linkSpecificProps = props as Omit<RouterLinkProps, keyof CommonButtonProps | 'to'>;
    return (
      <Link to={to} className={combinedClassName} {...linkSpecificProps}>
        {loadingIcon}
        {children}
      </Link>
    );
  }

  const buttonSpecificProps = props as Omit<HtmlButtonProps, keyof CommonButtonProps>;
  return (
    <button
      className={combinedClassName}
      disabled={isLoading || buttonSpecificProps.disabled}
      type={buttonSpecificProps.type || 'button'} 
      {...buttonSpecificProps}
    >
      {loadingIcon}
      {children}
    </button>
  );
};

export default Button;