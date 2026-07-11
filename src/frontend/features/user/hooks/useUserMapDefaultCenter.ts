"use client";

import { useMemo } from "react";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { useAuthPermission } from "~/frontend/features/auth/components/hooks/useAuthPermission";
import { useUserQuery } from "~/frontend/features/user/hooks/useUserQuery";

export function useUserMapDefaultCenter() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthPermission();
  const { user, isLoading: isUserLoading } = useUserQuery({
    enabled: isAuthenticated,
  });
  const isReady = !isAuthLoading && (!isAuthenticated || !isUserLoading);

  const defaultCenter = useMemo(
    () =>
      user?.homeLat != null && user?.homeLng != null
        ? { lat: user.homeLat, lng: user.homeLng }
        : GOOGLE_MAP_DEFAULT_CENTER,
    [user?.homeLat, user?.homeLng]
  );

  return {
    defaultCenter,
    isReady,
  };
}
