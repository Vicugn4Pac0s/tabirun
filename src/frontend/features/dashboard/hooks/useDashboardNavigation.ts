import { useRouter } from "next/navigation";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import {
  useSelectedRouteStore,
  type SelectedRoute,
} from "~/frontend/features/route/stores/selectedRouteStore";

export function useDashboardNavigation() {
  const router = useRouter();

  const openRoute = (route: SelectedRoute) => {
    useSelectedRouteStore.getState().selectRoute(route);
    useRoutePointsStore.getState().setRoutePoints(route.points);
    router.push("/map");
  };

  const createRoute = () => {
    useSelectedRouteStore.getState().clearSelectedRoute();
    useRoutePointsStore.getState().clearRoutePoints();
    router.push("/map");
  };

  return { openRoute, createRoute };
}
