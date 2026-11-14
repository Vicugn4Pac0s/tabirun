"use client";

import Link from "next/link";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { useNavigationGuard } from "~/frontend/providers/NavigationGuardProvider";

type GuardedLinkProps = Omit<
  ComponentPropsWithoutRef<typeof Link>,
  "onNavigate"
>;

/** Next.jsの画面遷移時に離脱確認を行い、拒否された場合は遷移を中止する。
 * NavigationGuardProviderの外では通常どおり遷移する。 */
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
