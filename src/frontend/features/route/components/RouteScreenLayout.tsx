"use client";

import type { ReactNode } from "react";
import { NavigationGuardProvider } from "~/frontend/providers/NavigationGuardProvider";
import MobileSidebarSheet from "~/frontend/components/app-ui/MobileSidebarSheet";
import { useIsMobile } from "~/frontend/hooks/shared/useIsMobile";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";
import RouteMenuButton from "./RouteMenuButton";

type RouteScreenLayoutProps = {
  panelTitle: string;
  menuTriggerLabel: string;
  panel: ReactNode;
  children: ReactNode;
  confirmNavigation?: () => boolean;
};

/**
 * ルート画面のパネルをPCではサイドバー、モバイルでは開閉シートに配置する。
 * 移動確認を渡した場合だけ配下にNavigationGuardProviderを設ける。
 */
export function RouteScreenLayout({
  panelTitle,
  menuTriggerLabel,
  panel,
  children,
  confirmNavigation,
}: RouteScreenLayoutProps) {
  const isMobile = useIsMobile();

  const content = (
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

  return confirmNavigation ? (
    <NavigationGuardProvider confirmNavigation={confirmNavigation}>
      {content}
    </NavigationGuardProvider>
  ) : (
    content
  );
}
