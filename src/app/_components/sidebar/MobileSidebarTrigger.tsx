"use client";

import { forwardRef } from "react";
import { Menu } from "lucide-react";
import { cn } from "~/frontend/lib/utils";
import { Button, type ButtonProps } from "~/frontend/components/ui/button";
import { useMobileSidebarTriggerState } from "./hooks/useMobileSidebarTriggerState";

const MobileSidebarTrigger = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    const { ariaLabel, label } = useMobileSidebarTriggerState();

    return (
      <Button
        ref={ref}
        variant="outline"
        size="default"
        className={cn(
          "absolute right-0 bottom-28 z-50 md:hidden",
          "flex h-auto w-10 flex-col items-center gap-1",
          "rounded-l-2xl rounded-r-none border-r-0 px-0 py-3 shadow-md",
          className
        )}
        aria-label={ariaLabel}
        {...props}
      >
        <Menu className="h-4 w-4 shrink-0" />
        {label ? (
          <span
            className="text-xs font-semibold leading-tight"
            style={{ writingMode: "vertical-rl" }}
          >
            {label}
          </span>
        ) : null}
      </Button>
    );
  }
);

MobileSidebarTrigger.displayName = "MobileSidebarTrigger";

export default MobileSidebarTrigger;
