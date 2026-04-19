import { useSession } from "next-auth/react";

type UserPlan = "guest" | "free" | "premium";

export function useAuthPermission() {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  let plan: UserPlan = "guest";

  if (isAuthenticated) {
    plan = "free";
  }

  const permissions = {
    canUseDirections: isAuthenticated,
    // canCreateRoute: isAuthenticated,
    // canUsePremiumFeature: plan === "premium",
  };

  return {
    session,
    status,
    plan,
    isLoading,
    isAuthenticated,
    permissions,
  };
}