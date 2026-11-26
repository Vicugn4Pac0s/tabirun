"use client";

import { PanelBottom, PanelRight } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "~/frontend/lib/utils";
import { Button, type ButtonProps } from "~/frontend/components/ui/button";

type RouteMenuButtonProps = Omit<ButtonProps, "children"> & {
  label?: string;
};

/**
 * 距離とパネルの開閉アイコンを横並びに表示する。数字を含むラベルを強調する。
 */
const RouteMenuButton = forwardRef<HTMLButtonElement, RouteMenuButtonProps>(
  ({ className, label = "MENU", ...props }, ref) => {
    const isDistanceLabel = typeof label === "string" && /\d/.test(label);

    return (
      <Button
        ref={ref}
        variant="outline"
        className={cn(
          "h-12 gap-3 rounded-lg bg-background px-3 shadow-md",
          className,
        )}
        aria-label="メニューを開く"
        {...props}
      >
        {label ? (
          <span
            className={cn(
              "font-inter text-primary",
              isDistanceLabel
                ? "text-2xl font-black italic"
                : "text-sm font-bold",
            )}
          >
            {label}
          </span>
        ) : null}
        <span className="border-l pl-3 text-primary" aria-hidden="true">
          <PanelRight className="hidden h-5 w-5 md:block" />
          <PanelBottom className="h-5 w-5 md:hidden" />
        </span>
      </Button>
    );
  },
);

RouteMenuButton.displayName = "RouteMenuButton";

export default RouteMenuButton;
