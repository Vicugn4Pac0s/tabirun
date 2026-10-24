"use client";

import { Route } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "~/frontend/lib/utils";
import { Button, type ButtonProps } from "~/frontend/components/ui/button";

type RouteMenuButtonProps = Omit<ButtonProps, "children"> & {
  label?: string;
};

const RouteMenuButton = forwardRef<HTMLButtonElement, RouteMenuButtonProps>(
  ({ className, label = "MENU", ...props }, ref) => {
    const isDistanceLabel = typeof label === "string" && /\d/.test(label);

    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn(
          "absolute bottom-28 right-0 z-50 md:hidden",
          "flex h-auto w-10 flex-col items-center gap-2",
          "rounded-r-none rounded-tl-md border-r-0 px-0 py-3 shadow-md",
          className,
        )}
        aria-label="メニューを開く"
        {...props}
      >
        <Route className="h-4 w-4 shrink-0 text-base-gray" />
        {label ? (
          <span
            className={cn(
              "font-inter text-base-gray",
              isDistanceLabel ? "text-lg font-black" : "text-md font-bold",
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
  },
);

RouteMenuButton.displayName = "RouteMenuButton";

export default RouteMenuButton;
