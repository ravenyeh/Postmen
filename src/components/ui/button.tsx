import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-600/25 hover:shadow-xl hover:shadow-violet-600/35 hover:from-violet-500 hover:to-violet-400 active:scale-[0.98]",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-600/25 hover:shadow-xl hover:shadow-red-600/35",
        outline:
          "border border-white/10 bg-white/5 backdrop-blur-sm shadow-sm hover:bg-white/10 hover:border-violet-500/30",
        secondary:
          "bg-blue-600/20 text-blue-400 border border-blue-500/20 hover:bg-blue-600/30 hover:border-blue-500/30",
        success:
          "bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/30 hover:border-emerald-500/30",
        ghost: "hover:bg-white/10",
        link: "text-violet-400 underline-offset-4 hover:underline hover:text-violet-300",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
