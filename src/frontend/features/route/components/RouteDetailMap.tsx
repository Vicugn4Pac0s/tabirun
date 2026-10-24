"use client";

import StreetView from "~/frontend/features/googlemap/components/StreetView";
import StreetViewPointMarker from "~/frontend/features/googlemap/components/StreetViewPointMarker";
import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { useRoutePreview } from "../hooks/useRoutePreview";

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

function RouteDetailMapContent({ points }: RouteDetailMapProps) {
  const { map, setMap, path, isLoading, error } = useRouteDetailMap(points);

  const preview = useRoutePreview();
  const initialCenter = points[0] ?? GOOGLE_MAP_DEFAULT_CENTER;

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
      <p className="mb-3 text-sm text-gray-600">
        地図や経由地点を選ぶと、その地点のStreet Viewで下見できます。
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-[50vh] min-h-80 overflow-hidden rounded-xl border">
          <GoogleMapView
            map={map}
            setMap={setMap}
            isLoading={isLoading}
            onClick={(event) => {
              if (event.latLng)
                void preview.previewPoint(event.latLng.toJSON());
            }}
            options={{
              center: initialCenter,
              zoom: GOOGLE_MAP_DEFAULT_ZOOM,
              minZoom: GOOGLE_MAP_MIN_ZOOM,
              maxZoom: GOOGLE_MAP_MAX_ZOOM,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            <StreetViewPointMarker
              map={map}
              latLng={preview.streetViewUnavailable ? null : preview.position}
              pov={preview.pov}
            />
            {path && <RoutePolyline map={map} polylineArray={path} />}
            {points.map((point, index) => (
              <RoutePointMarker
                key={index}
                map={map}
                latLng={point}
                index={index}
                onClick={() => {
                  void preview.previewPoint(point);
                }}
              />
            ))}
          </GoogleMapView>
        </div>
        <div
          className="relative h-[50vh] min-h-80 overflow-hidden rounded-xl border"
          role="region"
          aria-label="Street Viewで下見"
        >
          <StreetView
            map={map}
            streetView={preview.streetView}
            options={{
              position: initialCenter,
              pov: { heading: 165, pitch: 0 },
              zoomControl: false,
              addressControl: false,
              motionTrackingControl: false,
            }}
            onInit={() => {
              void preview.previewPoint(initialCenter);
            }}
            onPositionChanged={(position) =>
              preview.setPosition(position.toJSON())
            }
            onPovChanged={preview.setPov}
          />
          {preview.streetViewUnavailable && (
            <div
              role="status"
              className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center text-white"
            >
              この地点ではStreet
              Viewを表示できません。地図や経由地点から別の地点を選んでください。
            </div>
          )}
        </div>
      </div>
      <div
        className="mt-3 flex flex-wrap gap-2"
        role="group"
        aria-label="下見する経由地点"
      >
        {points.map((point, index) => (
          <button
            key={index}
            type="button"
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={() => {
              void preview.previewPoint(point);
            }}
          >
            地点 {index + 1} を下見
          </button>
        ))}
      </div>
    </section>
  );
}

export function RouteDetailMap(props: RouteDetailMapProps) {
  return (
    <GoogleMapProvider>
      <RouteDetailMapContent {...props} />
    </GoogleMapProvider>
  );
}
