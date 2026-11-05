"use client";

import Link from "next/link";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { useNavigationGuard } from "~/frontend/providers/NavigationGuardProvider";

type GuardedLinkProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  "onNavigate"
>;

export const GuardedLink = forwardRef<HTMLAnchorElement, GuardedLinkProps>(
  function GuardedLink({ onClick, ...props }, ref) {
    const confirmNavigation = useNavigationGuard();
    return (
      <Link
        {...props}
        ref={ref}
        onClick={(event) => {
          onClick?.(event);
          // 別タブ表示やダウンロードでは、編集中の画面から離れない。
          if (
            event.defaultPrevented ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            (event.currentTarget.target &&
              event.currentTarget.target !== "_self") ||
            event.currentTarget.hasAttribute("download")
          )
            return;
          if (confirmNavigation && !confirmNavigation()) event.preventDefault();
        }}
      />
    );
  },
);
