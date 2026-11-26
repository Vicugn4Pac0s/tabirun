"use client";

import type { ReactNode } from "react";
import { ResponsivePanel } from "~/frontend/components/app-ui/ResponsivePanel";
import { NavigationGuardProvider } from "~/frontend/providers/NavigationGuardProvider";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";

type RouteMapLayoutProps = {
  panelContent: ReactNode;
  panelOpen: boolean;
  onPanelOpenChange: (open: boolean) => void;
  children: ReactNode;
  confirmNavigation?: () => boolean;
};

/** 地図画面とパネルを配置する。移動確認を渡した場合だけNavigationGuardProviderを設ける。 */
export function RouteMapLayout({
  panelContent,
  panelOpen,
  onPanelOpenChange,
  children,
  confirmNavigation,
}: RouteMapLayoutProps) {
  const content = (
    <div className="relative min-h-screen">
      <div className="relative flex min-w-0">{children}</div>
      <div
        onKeyDown={(event) => {
          // パネルのEnter操作を、地図の地点追加・削除ショートカットへ流さない。
          if (event.key === "Enter") event.stopPropagation();
        }}
      >
        <ResponsivePanel
          title="ルート情報"
          open={panelOpen}
          onOpenChange={onPanelOpenChange}
        >
          {panelContent}
        </ResponsivePanel>
      </div>
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
