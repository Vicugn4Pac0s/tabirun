import type { ReactNode } from "react";

type WarningBannerProps = {
  children: ReactNode;
};

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
