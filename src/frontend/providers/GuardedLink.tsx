"use client";

import Link from "next/link";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { useNavigationGuard } from "~/frontend/providers/NavigationGuardProvider";

type GuardedLinkProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  "onNavigate"
>;

export const GuardedLink = forwardRef<HTMLAnchorElement, GuardedLinkProps>(
  function GuardedLink(props, ref) {
    const confirmNavigation = useNavigationGuard();
    return (
      <Link
        {...props}
        ref={ref}
        onNavigate={(event) => {
          if (confirmNavigation && !confirmNavigation()) event.preventDefault();
        }}
      />
    );
  },
);
