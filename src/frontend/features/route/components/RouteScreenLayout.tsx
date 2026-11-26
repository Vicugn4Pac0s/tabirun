"use client";

import type { ReactNode } from "react";
import { RouteSidebar } from "./RouteSidebar";
import { NavigationGuardProvider } from "~/frontend/providers/NavigationGuardProvider";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";

type RouteScreenLayoutProps = {
  sidebar: ReactNode;
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
  children: ReactNode;
  confirmNavigation?: () => boolean;
};

/** 地図画面とサイドバーを配置する。移動確認を渡した場合だけNavigationGuardProviderを設ける。 */
export function RouteScreenLayout({
  sidebar,
  sidebarOpen,
  onSidebarOpenChange,
  children,
  confirmNavigation,
}: RouteScreenLayoutProps) {
  const content = (
    <div className="relative min-h-screen">
      <div className="relative flex min-w-0">{children}</div>
      <RouteSidebar
        title="ルート情報"
        open={sidebarOpen}
        onOpenChange={onSidebarOpenChange}
      >
        {sidebar}
      </RouteSidebar>
      <div className="absolute right-3 top-3 z-40">
        <AuthUserMenu />
      </div>
    </div>
  );

  return confirmNavigation ? (
    <NavigationGuardProvider confirmNavigation={confirmNavigation}>
      {content}
    </NavigationGuardProvider>
  ) : (
    content
  );
}
