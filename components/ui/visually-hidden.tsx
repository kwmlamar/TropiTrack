import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const VisuallyHidden = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      ref={ref}
      className={cn(
        "sr-only",
        className
      )}
      {...props}
    />
  );
});
VisuallyHidden.displayName = "VisuallyHidden";

export { VisuallyHidden };
