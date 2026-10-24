"use client";

import { useCallback } from "react";
import { useOptionalGoogleMap } from "../providers/GoogleMapProvider";

export const useCurrentStreetViewPosition = () => {
  const context = useOptionalGoogleMap();
  const streetView = context?.streetView;

  const getCurrentStreetViewPosition = useCallback(() => {
    return streetView?.current?.getPosition()?.toJSON() ?? null;
  }, [streetView]);

  return {
    canReadCurrentStreetViewPosition: streetView?.current != null,
    getCurrentStreetViewPosition,
  };
};
