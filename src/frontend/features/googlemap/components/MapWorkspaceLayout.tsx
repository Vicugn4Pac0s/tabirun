"use client";

import type { ReactElement, ReactNode } from "react";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";
import Sidebar from "~/frontend/components/layout/Sidebar";
import { Button } from "~/frontend/components/ui/button";
import MobileSidebarSheet from "./MobileSidebarSheet";

type MapWorkspaceLayoutProps = {
  sidebar: ReactNode;
  children: ReactNode;
  mobileTrigger?: ReactElement;
};

export function MapWorkspaceLayout({
  sidebar,
  children,
  mobileTrigger,
}: MapWorkspaceLayoutProps) {
  return (
    <div className="relative flex min-h-screen">
      <aside
        aria-label="ルート情報"
        className="hidden h-screen w-72 shrink-0 overflow-y-auto md:block"
      >
        <Sidebar>{sidebar}</Sidebar>
      </aside>
      <div className="md:hidden">
        <MobileSidebarSheet
          title="ルート情報"
          trigger={
            mobileTrigger ?? (
              <Button
                variant="outline"
                className="absolute bottom-28 right-0 z-50"
                aria-label="ルート情報を開く"
              >
                ルート情報
              </Button>
            )
          }
        >
          {sidebar}
        </MobileSidebarSheet>
      </div>
      {children}
      <div className="absolute right-3 top-3 z-50">
        <AuthUserMenu />
      </div>
    </div>
  );
}
