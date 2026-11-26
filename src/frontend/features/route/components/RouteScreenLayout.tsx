"use client";

import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { NavigationGuardProvider } from "~/frontend/providers/NavigationGuardProvider";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";
import { cn } from "~/frontend/lib/utils";
import RouteMenuButton from "./RouteMenuButton";
import { RouteSidebar } from "./RouteSidebar";

type RouteScreenLayoutProps = {
  panelTitle: string;
  menuTriggerLabel: string;
  panel: ReactNode;
  children: ReactNode;
  confirmNavigation?: () => boolean;
};

/**
 * 距離ボタンで情報パネルを開閉する。PCは右サイド、モバイルは下半分のモーダルで表示する。
 * 編集状態は呼出側に保持する。移動確認を渡した場合だけNavigationGuardProviderを設ける。
 */
export function RouteScreenLayout({
  panelTitle,
  menuTriggerLabel,
  panel,
  children,
  confirmNavigation,
}: RouteScreenLayoutProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const stopPointShortcut = (event: KeyboardEvent) => {
    // パネルのEnter操作を、地図の地点追加・削除ショートカットへ流さない。
    if (event.key === "Enter") event.stopPropagation();
  };
  const content = (
    <div className={cn("relative min-h-screen", open && "md:pr-80")}>
      <div className="relative flex min-w-0">
        <div className="absolute left-3 top-[calc(50vh+0.75rem)] z-30 min-[1201px]:top-3">
          <RouteMenuButton
            ref={triggerRef}
            label={menuTriggerLabel}
            aria-label={`${panelTitle}を${open ? "閉じる" : "開く"}`}
            aria-controls={panelId}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            onKeyDown={stopPointShortcut}
          />
        </div>
        {children}
      </div>
      <RouteSidebar
        id={panelId}
        title={panelTitle}
        open={open}
        onOpenChange={setOpen}
        triggerRef={triggerRef}
      >
        {panel}
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
