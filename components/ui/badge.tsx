"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "secondary" | "destructive" | "outline";
  }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
      {
        "gradient-primary text-white": variant === "default",
        "bg-secondary text-secondary-foreground": variant === "secondary",
        "bg-destructive text-destructive-foreground": variant === "destructive",
        "border border-border text-foreground": variant === "outline",
      },
      className
    )}
    {...props}
  />
));
Badge.displayName = "Badge";

export { Badge };
