"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useGoogleMap } from "../providers/GoogleMapProvider";
import { useRoutePreview } from "../hooks/useRoutePreview";
import { useApplyMapDefaultCenter } from "../hooks/useApplyMapDefaultCenter";
import { useFocusMapOnRoute } from "../hooks/useFocusMapOnRoute";
import {
  GOOGLE_MAP_DEFAULT_ZOOM,
  GOOGLE_MAP_MAX_ZOOM,
  GOOGLE_MAP_MIN_ZOOM,
} from "~/frontend/config";
import GoogleMapView from "./GoogleMapView";
import StreetView from "./StreetView";
import RoutePointMarker from "./RoutePointMarker";
import StreetViewPointMarker from "./StreetViewPointMarker";
import RoutePolyline from "./RoutePolyline";

type RouteMapViewProps = {
  initialCenter: google.maps.LatLngLiteral;
  routePoints: google.maps.LatLngLiteral[];
  polylinePath: google.maps.LatLngLiteral[] | null;
  isDirectionLoading: boolean;
  fitToRoute?: boolean;
  renderNavigation?: (point: google.maps.LatLngLiteral) => ReactNode;
  notice?: ReactNode;
};

function RouteMapView({
  initialCenter,
  routePoints,
  polylinePath,
  isDirectionLoading,
  fitToRoute = false,
  renderNavigation,
  notice,
}: RouteMapViewProps) {
  const { map, setMap } = useGoogleMap();
  const {
    streetView,
    streetViewUnavailable,
    position: streetViewCenter,
    setPosition: setStreetViewCenter,
    pov: streetViewPov,
    setPov: setStreetViewPov,
    previewPoint: moveStreetView,
  } = useRoutePreview();
  useApplyMapDefaultCenter({ center: initialCenter, enabled: true });
  const [initialPoints] = useState(routePoints);
  const { focusMapOnRoute } = useFocusMapOnRoute();
  useEffect(() => {
    if (fitToRoute) focusMapOnRoute(initialPoints);
  }, [fitToRoute, focusMapOnRoute, initialPoints]);

  return (
    <div className="relative grid min-w-0 flex-1 grid-cols-1 min-[1201px]:grid-cols-2">
      <div
        role="region"
        aria-label="Street Viewで下見"
        className="relative order-2 h-[50vh] min-[1201px]:order-none min-[1201px]:h-screen"
      >
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
          onInit={() => {
            void moveStreetView(initialCenter);
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
          {streetViewCenter && renderNavigation?.(streetViewCenter)}
        </div>
      </div>
      <div className="relative order-1 h-[50vh] min-[1201px]:order-none min-[1201px]:h-screen">
        {notice && (
          <div className="absolute left-3 right-3 top-3 z-30">{notice}</div>
        )}
        <GoogleMapView
          className="h-full"
          map={map}
          setMap={setMap}
          isLoading={isDirectionLoading}
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
            void moveStreetView(latLng.toJSON());
          }}
        >
          <StreetViewPointMarker
            map={map}
            latLng={streetViewUnavailable ? null : streetViewCenter}
            pov={streetViewPov}
          />
          {polylinePath && (
            <RoutePolyline map={map} polylineArray={polylinePath} />
          )}
          {!isDirectionLoading &&
            routePoints.map((point, index) => (
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

export default RouteMapView;
