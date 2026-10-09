import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-medium px-6 py-3 rounded-lg transition-all cursor-pointer';
  const variantStyles =
    variant === 'primary'
      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300';

  return (
    <button className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </button>
  );
};