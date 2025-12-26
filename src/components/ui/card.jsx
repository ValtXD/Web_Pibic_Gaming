import React from 'react';

export const Card = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`}
      {...props}
    />
  );
});
Card.displayName = "Card";

export const CardContent = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`p-6 pt-0 ${className}`}
      {...props}
    />
  );
});
CardContent.displayName = "CardContent";