import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-lime text-primary shadow-soft hover:shadow-glow hover:-translate-y-0.5",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-primary/25 bg-card text-primary shadow-sm hover:border-secondary/60 hover:bg-muted",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/85",
        ghost: "text-primary hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-olive text-primary-foreground shadow-soft hover:shadow-lift hover:-translate-y-0.5",
        lime: "bg-gradient-lime text-primary shadow-soft hover:shadow-glow hover:-translate-y-0.5 hover:[&_svg]:translate-x-0.5",
        onOlive:
          "border border-accent/40 bg-transparent text-accent backdrop-blur-sm hover:border-accent hover:bg-accent/15 hover:-translate-y-0.5",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-13 px-9 text-base",
        icon: "h-10 w-10",
      },
    },


    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
