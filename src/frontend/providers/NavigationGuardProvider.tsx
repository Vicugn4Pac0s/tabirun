"use client";

import { createContext, useContext, type ReactNode } from "react";

const NavigationGuardContext = createContext<(() => boolean) | null>(null);

type NavigationGuardProviderProps = {
  confirmNavigation: () => boolean;
  children: ReactNode;
};

/** 配下のリンクで使う離脱確認を提供する。確認の実行は利用側に委ねる。 */
export function NavigationGuardProvider({
  confirmNavigation,
  children,
}: NavigationGuardProviderProps) {
  return (
    <NavigationGuardContext.Provider value={confirmNavigation}>
      {children}
    </NavigationGuardContext.Provider>
  );
}

/** 最も近いProviderの離脱確認を返す。Providerの外ではnullを返す。 */
export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}
