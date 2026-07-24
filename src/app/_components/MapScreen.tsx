import { useState } from "react";
import { useGoogleMap } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import { useApplyMapDefaultCenter } from "~/frontend/features/googlemap/hooks/useApplyMapDefaultCenter";
import { useRouteEditorState } from "~/frontend/features/route/hooks/useRouteEditorState";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import useRoutePolylinePath from "~/frontend/hooks/googlemap/useRoutePolylinePath";
import {
  GOOGLE_MAP_DEFAULT_ZOOM,
  GOOGLE_MAP_MAX_ZOOM,
  GOOGLE_MAP_MIN_ZOOM,
} from "~/frontend/config";
import { useAuthPermission } from "~/frontend/features/auth/components/hooks/useAuthPermission";
import { useUserMapDefaultCenter } from "~/frontend/features/user/hooks/useUserMapDefaultCenter";
import { Spinner } from "~/frontend/components/ui/spinner";
import GoogleMapView from "~/frontend/features/googlemap/components/GoogleMapView";
import StreetView from "~/frontend/features/googlemap/components/StreetView";
import RoutePointsNavigation from "~/frontend/features/route-points-navigation/components/RouteNavigation";
import RoutePointMarker from "~/frontend/features/googlemap/components/RoutePointMarker";
import StreetViewPointMarker from "~/frontend/features/googlemap/components/StreetViewPointMarker";
import RoutePolyline from "~/frontend/features/googlemap/components/RoutePolyline";

function MapScreen() {
  const { permissions } = useAuthPermission();
  const { map, setMap, streetView, streetViewUnavailable } = useGoogleMap();
  const moveStreetView = useMoveStreetView();
  const { defaultCenter, isReady: isDefaultCenterReady } =
    useUserMapDefaultCenter();
  const [streetViewCenter, setStreetViewCenter] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [streetViewPov, setStreetViewPov] =
    useState<google.maps.StreetViewPov | null>(null);
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const { canEditRoutePoints } = useRouteEditorState();
  const { polylinePath } = useRoutePolylinePath(routePoints, {
    canUseDirections: permissions.canUseDirections,
  });

  useApplyMapDefaultCenter({
    center: defaultCenter,
    enabled: isDefaultCenterReady,
  });

  if (!isDefaultCenterReady) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-base-gray-light">
        <Spinner className="size-8 text-base-gray/70" />
      </div>
    );
  }

  return (
    <div className="relative grid flex-1 grid-cols-1 min-[1201px]:grid-cols-2">
      <div className="relative order-2 h-[50vh] min-[1201px]:order-none min-[1201px]:h-screen">
        <StreetView
          map={map}
          streetView={streetView}
          options={{
            position: defaultCenter,
            pov: { heading: 165, pitch: 0 },
            zoomControl: false,
            addressControl: false,
            motionTrackingControl: false,
          }}
          onPositionChanged={(position) => {
            setStreetViewCenter(position.toJSON());
          }}
          onPovChanged={(pov) => {
            setStreetViewPov(pov);
          }}
        />
        {streetViewUnavailable && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 px-6 text-center text-white">
            <div>
              <p className="text-lg font-bold">
                この地点ではStreet Viewを表示できません
              </p>
              <p className="mt-2 text-sm text-white/80">
                道路沿いなど、Street Viewに対応した地点を選んでください。
              </p>
            </div>
          </div>
        )}
        <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2">
          {streetViewCenter && (
            <RoutePointsNavigation
              currentPoint={streetViewCenter}
              canEdit={canEditRoutePoints}
            />
          )}
        </div>
      </div>
      <div className="order-1 h-[50vh] min-[1201px]:order-none min-[1201px]:h-screen">
        <GoogleMapView
          className="h-full"
          map={map}
          setMap={setMap}
          options={{
            center: defaultCenter,
            zoom: GOOGLE_MAP_DEFAULT_ZOOM,
            maxZoom: GOOGLE_MAP_MAX_ZOOM,
            minZoom: GOOGLE_MAP_MIN_ZOOM,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onClick={(e) => {
            const latLng = e.latLng;
            if (!latLng) return;
            void moveStreetView(latLng.toJSON());
          }}
        >
          <StreetViewPointMarker
            map={map}
            latLng={streetViewCenter}
            pov={streetViewPov}
          />
          {polylinePath && (
            <RoutePolyline map={map} polylineArray={polylinePath} />
          )}
          {routePoints.map((point, index) => (
            <RoutePointMarker
              key={index}
              map={map}
              latLng={point}
              index={index}
              onClick={() => {
                void moveStreetView(point);
              }}
            />
          ))}
        </GoogleMapView>
      </div>
    </div>
  );
}

export default MapScreen;
