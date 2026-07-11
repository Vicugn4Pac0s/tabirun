"use client";

import { forwardRef } from "react";
import { Menu } from "lucide-react";
import { cn } from "~/frontend/lib/utils";
import { Button, type ButtonProps } from "~/frontend/components/ui/button";
import { useMobileSidebarTriggerState } from "./hooks/useMobileSidebarTriggerState";

const MobileSidebarTrigger = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    const { ariaLabel, isCompact, label } = useMobileSidebarTriggerState();

    return (
      <Button
        ref={ref}
        variant="outline"
        size={isCompact ? "icon" : "default"}
        className={cn(
          "absolute left-3 top-3 z-50 md:hidden",
          !isCompact && "h-10 rounded-full px-3 text-sm font-semibold",
          className
        )}
        aria-label={ariaLabel}
        {...props}
      >
        <Menu />
        {label ? <span>{label}</span> : null}
      </Button>
    );
  }
);

MobileSidebarTrigger.displayName = "MobileSidebarTrigger";

export default MobileSidebarTrigger;
