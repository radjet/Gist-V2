import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  active = false,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90",
    secondary: "bg-surface border border-border text-slate-200 hover:bg-border/50 hover:text-white",
    ghost: "text-slate-400 hover:text-white hover:bg-white/5",
    icon: "p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full"
  };

  const activeStyles = active ? "bg-white/10 text-white" : "";

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  // Icon variant ignores size mostly, but we keep the mapping simple
  const sizeClass = variant === 'icon' ? '' : sizes[size];

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizeClass} ${activeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};