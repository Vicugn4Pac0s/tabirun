"use client";

import { useCallback } from "react";
import { useGoogleMap } from "../providers/GoogleMapProvider";

export const useCurrentStreetViewPosition = () => {
  const { streetView } = useGoogleMap();

  const getCurrentStreetViewPosition = useCallback(() => {
    return streetView.current?.getPosition()?.toJSON() ?? null;
  }, [streetView]);

  return {
    canReadCurrentStreetViewPosition: streetView.current != null,
    getCurrentStreetViewPosition,
  };
};
