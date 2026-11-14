import type { ReactNode } from "react";

type WarningBannerProps = {
  children: ReactNode;
};

/** 続行可能な警告をalertとして表示する。警告の条件や文言は呼出側で決める。 */
export function WarningBanner({ children }: WarningBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
    >
      {children}
    </div>
  );
}
