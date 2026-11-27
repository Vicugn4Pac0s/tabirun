"use client";

import { PanelBottom, PanelRight } from "lucide-react";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "~/frontend/lib/utils";

type RouteMenuButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "children"
> & {
  label?: string;
};

/**
 * 距離とパネルの開閉アイコンを横並びに表示する。数字を含むラベルを強調する。
 */
const RouteMenuButton = forwardRef<HTMLButtonElement, RouteMenuButtonProps>(
  ({ className, label = "MENU", ...props }, ref) => {
    const isDistanceLabel = typeof label === "string" && /\d/.test(label);

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "inline-flex h-12 items-center justify-center gap-3 whitespace-nowrap rounded-lg bg-background px-3 shadow-md transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 disabled:cursor-not-allowed disabled:opacity-40",
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
                ? "text-2xl font-black italic tabular-nums"
                : "text-xs font-bold",
            )}
          >
            {label}
          </span>
        ) : null}
        <span
          className="border-l border-border pl-3 text-primary"
          aria-hidden="true"
        >
          <PanelRight className="hidden h-5 w-5 md:block" />
          <PanelBottom className="h-5 w-5 md:hidden" />
        </span>
      </button>
    );
  },
);

RouteMenuButton.displayName = "RouteMenuButton";

export default RouteMenuButton;
