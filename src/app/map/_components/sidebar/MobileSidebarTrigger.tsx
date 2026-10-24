"use client";

import { Route } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "~/frontend/lib/utils";
import { Button, type ButtonProps } from "~/frontend/components/ui/button";
import { useMobileSidebarTriggerState } from "./hooks/useMobileSidebarTriggerState";

const MobileSidebarTrigger = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    const { ariaLabel, label } = useMobileSidebarTriggerState();
    const isDistanceLabel = typeof label === "string" && /\d/.test(label);

    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn(
          "absolute right-0 bottom-28 z-50 md:hidden",
          "flex h-auto w-10 flex-col items-center gap-2",
          "rounded-tl-md rounded-r-none border-r-0 px-0 py-3 shadow-md",
          className
        )}
        aria-label={ariaLabel}
        {...props}
      >
        <Route className="h-4 w-4 shrink-0 text-base-gray" />
        {label ? (
          <span
            className={cn(
              "font-inter text-base-gray",
              isDistanceLabel
                ? "font-black text-lg"
                : "font-bold text-md"
            )}
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
            }}
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
