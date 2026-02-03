import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-[#0d2f52]",
        outline: "border border-slate-200 text-slate-700 hover:bg-slate-100",
        ghost: "text-slate-700 hover:bg-slate-100"
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        lg: "h-12 px-6"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}
