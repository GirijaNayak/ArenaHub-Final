import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "amber-subtle";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-medium transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99] cursor-pointer";

    const variants = {
      primary:
        "bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-sm border border-amber-400/40",
      secondary:
        "bg-[#161c28] hover:bg-[#1e2637] text-slate-200 border border-white/[0.08] shadow-sm",
      outline:
        "bg-transparent hover:bg-white/[0.05] text-slate-300 hover:text-white border border-white/[0.12]",
      danger:
        "bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-500/30",
      ghost:
        "bg-transparent hover:bg-white/[0.06] text-slate-400 hover:text-slate-200",
      "amber-subtle":
        "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30",
    };

    const sizes = {
      xs: "text-[11px] px-2 py-1 gap-1",
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-xs font-semibold px-3.5 py-2 gap-2",
      lg: "text-sm font-semibold px-5 py-2.5 gap-2",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(base, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
