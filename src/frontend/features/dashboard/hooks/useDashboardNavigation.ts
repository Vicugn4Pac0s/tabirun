import { useRouter } from "next/navigation";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import { useSelectedRouteStore } from "~/frontend/features/route/stores/selectedRouteStore";

export function useDashboardNavigation() {
  const router = useRouter();

  const createRoute = () => {
    useSelectedRouteStore.getState().clearSelectedRoute();
    useRoutePointsStore.getState().clearRoutePoints();
    router.push("/map");
  };

  return { createRoute };
}
