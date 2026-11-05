"use client";

import { createContext, useContext, type ReactNode } from "react";

const NavigationGuardContext = createContext<(() => boolean) | null>(null);

type NavigationGuardProviderProps = {
  confirmNavigation: () => boolean;
  children: ReactNode;
};

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

export function useNavigationGuard() {
  return useContext(NavigationGuardContext);
}
