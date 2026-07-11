import {
  GOOGLE_MAP_DEFAULT_CENTER,
  GOOGLE_MAP_DEFAULT_ZOOM,
  GOOGLE_MAP_MAX_ZOOM,
  GOOGLE_MAP_MIN_ZOOM,
} from "~/frontend/config";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUserQuery } from "~/frontend/features/user/hooks/useUserQuery";
import { useAuthPermission } from "~/frontend/features/auth/components/hooks/useAuthPermission";
import { useGoogleMap } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import { useRouteEditorState } from "~/frontend/features/route/hooks/useRouteEditorState";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import useRoutePolylinePath from "~/frontend/hooks/googlemap/useRoutePolylinePath";
import GoogleMapView from "~/frontend/features/googlemap/components/GoogleMapView";
import StreetView from "~/frontend/features/googlemap/components/StreetView";
import RoutePointsNavigation from "~/frontend/features/route-points-navigation/components/RouteNavigation";
import RoutePointMarker from "~/frontend/features/googlemap/components/RoutePointMarker";
import StreetViewPointMarker from "~/frontend/features/googlemap/components/StreetViewPointMarker";
import RoutePolyline from "~/frontend/features/googlemap/components/RoutePolyline";

function MapScreen() {
  const { permissions, isAuthenticated } = useAuthPermission();
  const { map, setMap, streetView, streetViewUnavailable } = useGoogleMap();
  const moveStreetView = useMoveStreetView();
  const { user } = useUserQuery({ enabled: isAuthenticated });
  const [streetViewCenter, setStreetViewCenter] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [streetViewPov, setStreetViewPov] =
    useState<google.maps.StreetViewPov | null>(null);
  const hasAppliedMapCenterRef = useRef(false);
  const hasAppliedStreetViewCenterRef = useRef(false);
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const { canEditRoutePoints } = useRouteEditorState();
  const { polylinePath } = useRoutePolylinePath(routePoints, {
    canUseDirections: permissions.canUseDirections,
  });
  const initialCenter = useMemo(
    () =>
      user?.homeLat != null && user?.homeLng != null
        ? { lat: user.homeLat, lng: user.homeLng }
        : GOOGLE_MAP_DEFAULT_CENTER,
    [user?.homeLat, user?.homeLng]
  );

  useEffect(() => {
    if (map && !hasAppliedMapCenterRef.current) {
      map.setCenter(initialCenter);
      hasAppliedMapCenterRef.current = true;
    }
  }, [initialCenter, map]);

  useEffect(() => {
    if (streetView.current && !hasAppliedStreetViewCenterRef.current) {
      streetView.current.setPosition(initialCenter);
      hasAppliedStreetViewCenterRef.current = true;
    }
  }, [initialCenter, map, streetView]);

  return (
    <div className="relative grid flex-1 grid-cols-1 min-[1201px]:grid-cols-2">
      <div className="relative order-2 h-[50vh] min-[1201px]:order-none min-[1201px]:h-screen">
        <StreetView
          map={map}
          streetView={streetView}
          options={{
            position: initialCenter,
            pov: { heading: 165, pitch: 0 },
            zoomControl: false,
            addressControl: false,
            motionTrackingControl: false,
          }}
          onPositionChanged={(position) => {
            const positionLatLngLiteral = position.toJSON();
            setStreetViewCenter(positionLatLngLiteral);
          }}
          onPovChanged={(pov) => {
            setStreetViewPov(pov);
          }}
        />
        {streetViewUnavailable && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 px-6 text-center text-white">
            <div>
              <p className="text-lg font-bold">この地点ではStreet Viewを表示できません</p>
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
            center: initialCenter,
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
            const latLngLiteral = latLng.toJSON();
            void moveStreetView(latLngLiteral);
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
