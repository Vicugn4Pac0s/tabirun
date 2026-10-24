"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useGoogleMap } from "../providers/GoogleMapProvider";
import { useMoveStreetView } from "../hooks/useMoveStreetView";
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

export type RouteMapMarker = {
  id: string;
  position: google.maps.LatLngLiteral;
  label: string;
  title: string;
  color?: string;
  onClick?: () => void;
};

type RouteMapViewProps = {
  initialCenter: google.maps.LatLngLiteral;
  path: google.maps.LatLngLiteral[] | null;
  markers: RouteMapMarker[];
  isLoading?: boolean;
  fitToRoute?: boolean;
  renderNavigation?: (point: google.maps.LatLngLiteral) => ReactNode;
  notice?: ReactNode;
};

function RouteMapView({
  initialCenter,
  path,
  markers,
  isLoading = false,
  fitToRoute = false,
  renderNavigation,
  notice,
}: RouteMapViewProps) {
  const {
    map,
    setMap,
    streetView,
    streetViewUnavailable,
    setStreetViewUnavailable,
  } = useGoogleMap();
  const moveStreetView = useMoveStreetView();
  const [streetViewCenter, setStreetViewCenter] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [streetViewPov, setStreetViewPov] =
    useState<google.maps.StreetViewPov | null>(null);

  const previewPoint = async (point: google.maps.LatLngLiteral) => {
    try {
      await moveStreetView(point);
    } catch {
      setStreetViewUnavailable(true);
    }
  };

  useApplyMapDefaultCenter({ center: initialCenter, enabled: true });
  const hasFittedRoute = useRef(false);
  const { focusMapOnRoute } = useFocusMapOnRoute();
  useEffect(() => {
    if (fitToRoute && !isLoading && !hasFittedRoute.current) {
      const positions = path?.length
        ? path
        : markers.map((marker) => marker.position);
      hasFittedRoute.current = focusMapOnRoute(positions);
    }
  }, [fitToRoute, isLoading, path, markers, focusMapOnRoute]);

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
            void previewPoint(initialCenter);
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
          isLoading={isLoading}
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
            void previewPoint(latLng.toJSON());
          }}
        >
          <StreetViewPointMarker
            map={map}
            latLng={streetViewUnavailable ? null : streetViewCenter}
            pov={streetViewPov}
          />
          {path && <RoutePolyline map={map} polylineArray={path} />}
          {!isLoading &&
            markers.map((marker) => (
              <RoutePointMarker
                key={marker.id}
                map={map}
                latLng={marker.position}
                label={marker.label}
                title={marker.title}
                color={marker.color}
                onClick={
                  marker.onClick ??
                  (() => {
                    void previewPoint(marker.position);
                  })
                }
              />
            ))}
        </GoogleMapView>
      </div>
    </div>
  );
}

export default RouteMapView;
