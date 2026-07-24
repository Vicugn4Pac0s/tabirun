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
  useEffect(() => {
    if (!map) {
      return;
    }

    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      map,
      content,
    });
    markerRef.current = marker;

    return () => {
      window.google.maps.event.clearInstanceListeners(marker);

      marker.map = null;

      if (markerRef.current === marker) {
        markerRef.current = null;
      }
    };
  }, [content, map, markerRef]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) {
      return;
    }

    marker.map = map;
    marker.content = content;

    Object.assign(marker, options);
  }, [content, map, markerRef, options]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) {
      return;
    }

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
      window.google.maps.event.clearListeners(marker, "click");

      if (contentElement && onMouseOver) {
        contentElement.removeEventListener("mouseover", onMouseOver);
      }
      if (contentElement && onMouseOut) {
        contentElement.removeEventListener("mouseout", onMouseOut);
      }
    };
  }, [map, markerRef, onClick, onMouseOver, onMouseOut]);

  return null;
};

export default AdvancedMarker;
