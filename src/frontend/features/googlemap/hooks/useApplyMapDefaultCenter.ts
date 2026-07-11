"use client";

import { useEffect, useRef } from "react";
import { useGoogleMap } from "../providers/GoogleMapProvider";

type UseApplyMapDefaultCenterParams = {
  center: google.maps.LatLngLiteral;
  enabled: boolean;
};

export function useApplyMapDefaultCenter({
  center,
  enabled,
}: UseApplyMapDefaultCenterParams) {
  const { map, streetView } = useGoogleMap();
  const hasAppliedMapCenterRef = useRef(false);
  const hasAppliedStreetViewCenterRef = useRef(false);

  useEffect(() => {
    if (enabled && map && !hasAppliedMapCenterRef.current) {
      map.setCenter(center);
      hasAppliedMapCenterRef.current = true;
    }
  }, [center, enabled, map]);

  useEffect(() => {
    if (
      enabled &&
      streetView.current &&
      !hasAppliedStreetViewCenterRef.current
    ) {
      streetView.current.setPosition(center);
      hasAppliedStreetViewCenterRef.current = true;
    }
  }, [center, enabled, streetView]);
}
