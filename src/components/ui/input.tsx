import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";
