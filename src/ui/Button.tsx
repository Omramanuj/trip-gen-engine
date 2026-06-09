"use client";

import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/ui/cn";

// Departures buttons: all pill-shaped. Coral is the hero action (one per screen);
// teal is the confident secondary; sky moves you forward; ghost/soft do quiet jobs.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-sans font-semibold rounded-full transition-all duration-base focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral-200 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-coral-500 text-white shadow-coral hover:bg-coral-600 hover:-translate-y-px",
        accent:
          "bg-coral-500 text-white shadow-coral hover:bg-coral-600 hover:-translate-y-px",
        teal:
          "bg-teal-600 text-cream-50 shadow-teal hover:bg-teal-700 hover:-translate-y-px",
        sky:
          "bg-sky-500 text-ink-700 shadow-sky hover:bg-sky-600",
        secondary:
          "bg-cream-50 text-ink-700 border border-cream-400 hover:bg-cream-100 hover:border-ink-400",
        soft: "bg-coral-100 text-coral-700 hover:bg-coral-200",
        ghost: "bg-transparent text-ink-700 border border-transparent hover:bg-cream-100",
        danger: "bg-cream-50 text-coral-700 border border-coral-200 hover:bg-coral-50",
      },
      size: {
        sm: "text-xs px-4 py-2",
        md: "text-sm px-[22px] py-3",
        lg: "text-base px-7 py-4",
        icon: "w-9 h-9 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
