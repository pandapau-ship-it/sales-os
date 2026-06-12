import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-[10px] border border-border bg-app-surface px-3 py-2 text-[13px] text-text-primary",
        "placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-sherloq-primary/30 focus:border-sherloq-primary",
        "disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
