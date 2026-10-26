"use client";
import { useEffect, useRef, useState } from "react";
import { useGoogleMap } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import { useFocusMapOnRoute } from "~/frontend/features/googlemap/hooks/useFocusMapOnRoute";
import {
  GOOGLE_MAP_DEFAULT_ZOOM,
  GOOGLE_MAP_MAX_ZOOM,
  GOOGLE_MAP_MIN_ZOOM,
} from "~/frontend/config";
import GoogleMapView from "~/frontend/features/googlemap/components/GoogleMapView";
import StreetView from "~/frontend/features/googlemap/components/StreetView";
import RoutePointMarker from "./RoutePointMarker";
import type { RouteMapMarker } from "../types";
import StreetViewPointMarker from "~/frontend/features/googlemap/components/StreetViewPointMarker";
import Polyline from "~/frontend/features/googlemap/components/Polyline";

type RouteMapViewProps = {
  initialCenter: google.maps.LatLngLiteral;
  path: google.maps.LatLngLiteral[] | null;
  markers: RouteMapMarker[];
  isLoading?: boolean;
  showStreetView?: boolean;
  fitToRoute?: boolean;
  onSelectedPointChange?: (point: google.maps.LatLngLiteral) => void;
};

function RouteMapView({
  initialCenter,
  path,
  markers,
  isLoading = false,
  showStreetView = false,
  fitToRoute = false,
  onSelectedPointChange,
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
    if (!showStreetView) return;
    try {
      await moveStreetView(point);
    } catch {
      setStreetViewUnavailable(true);
    }
  };

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
    <div
      data-street-view={showStreetView ? "visible" : "hidden"}
      className={`peer relative grid min-w-0 flex-1 grid-cols-1 ${showStreetView ? "min-[1201px]:grid-cols-2" : ""}`}
    >
      {showStreetView && (
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
              const point = position.toJSON();
              setStreetViewCenter(point);
              onSelectedPointChange?.(point);
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
        </div>
      )}
      <div
        className={`relative ${showStreetView ? "order-1 h-[50vh] min-[1201px]:order-none min-[1201px]:h-screen" : "h-screen"}`}
      >
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
          onClick={
            showStreetView
              ? (e) => {
                  const latLng = e.latLng;
                  if (latLng) void previewPoint(latLng.toJSON());
                }
              : undefined
          }
        >
          {showStreetView && (
            <StreetViewPointMarker
              map={map}
              latLng={streetViewUnavailable ? null : streetViewCenter}
              pov={streetViewPov}
            />
          )}
          {path && (
            <Polyline
              map={map}
              path={path}
              options={{ strokeColor: "black", strokeWeight: 3 }}
            />
          )}
          {!isLoading &&
            markers.map((marker) => (
              <RoutePointMarker
                key={marker.id}
                map={map}
                position={marker.position}
                label={marker.label}
                title={marker.title}
                color={marker.color}
                onClick={
                  marker.onClick ??
                  (showStreetView
                    ? () => {
                        void previewPoint(marker.position);
                      }
                    : undefined)
                }
              />
            ))}
        </GoogleMapView>
      </div>
    </div>
  );
}

export default RouteMapView;
