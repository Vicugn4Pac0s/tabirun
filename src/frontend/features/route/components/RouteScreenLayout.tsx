"use client";

import type { ReactNode } from "react";
import MobileSidebarSheet from "~/frontend/components/app-ui/MobileSidebarSheet";
import { useIsMobile } from "~/frontend/hooks/shared/useIsMobile";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";
import RouteMenuButton from "./RouteMenuButton";

type RouteScreenLayoutProps = {
  panelTitle: string;
  menuTriggerLabel: string;
  panel: ReactNode;
  children: ReactNode;
};

export function RouteScreenLayout({
  panelTitle,
  menuTriggerLabel,
  panel,
  children,
}: RouteScreenLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="relative flex min-h-screen">
      <aside
        aria-label={panelTitle}
        className="hidden h-screen w-72 shrink-0 overflow-y-auto md:block"
      >
        <div className="p-5">{!isMobile && panel}</div>
      </aside>
      {isMobile && (
        <div className="absolute bottom-28 right-0 z-50 md:hidden">
          <MobileSidebarSheet
            title={panelTitle}
            trigger={
              <RouteMenuButton
                label={menuTriggerLabel}
                aria-label={`${panelTitle}を開く`}
              />
            }
          >
            {panel}
          </MobileSidebarSheet>
        </div>
      )}
      {children}
      <div className="absolute right-3 top-3 z-50">
        <AuthUserMenu />
      </div>
    </div>
  );
}
