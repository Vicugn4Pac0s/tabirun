"use client";

import { useCallback } from "react";
import { useGoogleMap } from "../providers/GoogleMapProvider";

export const useCurrentMapCenter = () => {
  const { map } = useGoogleMap();

  const getCurrentMapCenter = useCallback(() => {
    return map?.getCenter()?.toJSON() ?? null;
  }, [map]);

  return {
    canReadCurrentMapCenter: map != null,
    getCurrentMapCenter,
  };
};
