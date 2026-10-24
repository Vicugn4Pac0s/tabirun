"use client";

import type { ReactElement, ReactNode } from "react";
import { Button } from "~/frontend/components/ui/button";
import MobileSidebarSheet from "~/frontend/components/app-ui/MobileSidebarSheet";

type SidebarLayoutProps = {
  sidebar: ReactNode;
  children: ReactNode;
  mobileTrigger?: ReactElement;
  sidebarTitle?: string;
  topRight?: ReactNode;
};

export function SidebarLayout({
  sidebar,
  children,
  mobileTrigger,
  sidebarTitle = "メニュー",
  topRight,
}: SidebarLayoutProps) {
  return (
    <div className="relative flex min-h-screen">
      <aside
        aria-label={sidebarTitle}
        className="hidden h-screen w-72 shrink-0 overflow-y-auto md:block"
      >
        <div className="p-5">{sidebar}</div>
      </aside>
      <div className="md:hidden">
        <MobileSidebarSheet
          title={sidebarTitle}
          trigger={
            mobileTrigger ?? (
              <Button
                variant="outline"
                className="absolute bottom-28 right-0 z-50"
                aria-label={`${sidebarTitle}を開く`}
              >
                {sidebarTitle}
              </Button>
            )
          }
        >
          {sidebar}
        </MobileSidebarSheet>
      </div>
      {children}
      {topRight && (
        <div className="absolute right-3 top-3 z-50">{topRight}</div>
      )}
    </div>
  );
}
