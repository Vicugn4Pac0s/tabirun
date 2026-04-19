import { useEffect } from "react";

interface AdvancedMarkerProps {
  map: google.maps.Map | null;
  markerRef: React.MutableRefObject<google.maps.marker.AdvancedMarkerElement | null>;
  options?: google.maps.marker.AdvancedMarkerElementOptions;
  content: HTMLElement;
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onMouseOver?: EventListener;
  onMouseOut?: EventListener;
}

const AdvancedMarker = ({
  map,
  markerRef,
  options = {},
  content,
  onClick,
  onMouseOver,
  onMouseOut,
}: AdvancedMarkerProps) => {
  const createMarker = () => {
    markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
      map,
      content,
      ...options,
    });

    return markerRef.current;
  };

  useEffect(() => {
    createMarker();

    return () => {
      if (markerRef.current) {
        markerRef.current.map =null;
      }
    };
  }, [map, markerRef, options.position]);

  useEffect(() => {
    const marker = markerRef.current;

    const contentElement = marker?.content;
    if (marker && onClick) {
      window.google.maps.event.clearListeners(marker, "click");
      marker.addListener("click", onClick);
    }
    if (contentElement && onMouseOver) {
      contentElement.addEventListener("mouseover", onMouseOver);
    }
    if (contentElement && onMouseOut) {
      contentElement.addEventListener("mouseout", onMouseOut);
    }

    return () => {
      if (markerRef.current) {
        if (contentElement && onMouseOver) {
          contentElement.removeEventListener("mouseover", onMouseOver as EventListener);
        }
        if (contentElement && onMouseOut) {
          contentElement.removeEventListener("mouseout", onMouseOut as EventListener);
        }
      }
    };
  }, [map, options, onClick, onMouseOver, onMouseOut]);

  return null;
};

export default AdvancedMarker;
