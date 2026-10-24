"use client";

import {
  GOOGLE_MAP_DEFAULT_CENTER,
  GOOGLE_MAP_DEFAULT_ZOOM,
  GOOGLE_MAP_MAX_ZOOM,
  GOOGLE_MAP_MIN_ZOOM,
} from "~/frontend/config";
import GoogleMapView from "~/frontend/features/googlemap/components/GoogleMapView";
import RoutePointMarker from "~/frontend/features/googlemap/components/RoutePointMarker";
import RoutePolyline from "~/frontend/features/googlemap/components/RoutePolyline";
import { useRouteDetailMap } from "../hooks/useRouteDetailMap";

type RouteDetailMapProps = {
  points: google.maps.LatLngLiteral[];
};

export function RouteDetailMap({ points }: RouteDetailMapProps) {
  const { map, setMap, path, isLoading, error } = useRouteDetailMap(points);

  return (
    <section aria-label="ルート地図" className="mt-6">
      {error && (
        <p
          role="alert"
          className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"
        >
          経路を取得できませんでした。経由地点のみ表示しています。時間をおいて再度お試しください。
        </p>
      )}
      <div className="h-[50vh] min-h-80 overflow-hidden rounded-xl border">
        <GoogleMapView
          map={map}
          setMap={setMap}
          isLoading={isLoading}
          options={{
            center: points[0] ?? GOOGLE_MAP_DEFAULT_CENTER,
            zoom: GOOGLE_MAP_DEFAULT_ZOOM,
            minZoom: GOOGLE_MAP_MIN_ZOOM,
            maxZoom: GOOGLE_MAP_MAX_ZOOM,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          {path && <RoutePolyline map={map} polylineArray={path} />}
          {points.map((point, index) => (
            <RoutePointMarker
              key={index}
              map={map}
              latLng={point}
              index={index}
            />
          ))}
        </GoogleMapView>
      </div>
    </section>
  );
}
