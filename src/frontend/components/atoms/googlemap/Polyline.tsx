import React, { useEffect } from "react";

interface PolylineProps {
  map: google.maps.Map | null;
  polyline: google.maps.Polyline | null;
  setPolyline: React.Dispatch<React.SetStateAction<google.maps.Polyline | null>>;
  options: google.maps.PolylineOptions;
}

function Polyline({map, polyline, setPolyline, options}: PolylineProps) {
  useEffect(() => {
    if (!polyline) {
      setPolyline(new window.google.maps.Polyline());
    }

    return () => {
      if (polyline) {
        polyline.setMap(null);
      }
    };
  }, [polyline]);

  useEffect(() => {
    if (polyline) {
      polyline.setOptions({
        map,
        ...options
      });
    }
  }, [map, polyline, options]);
  return null;
}

export default Polyline