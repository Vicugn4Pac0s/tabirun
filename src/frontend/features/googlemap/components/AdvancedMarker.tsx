import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface AdvancedMarkerProps {
  map: google.maps.Map | null;
  position: google.maps.LatLngLiteral;
  title?: string;
  children: ReactNode;
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onMouseOver?: EventListener;
  onMouseOut?: EventListener;
}

/**
 * 子要素を地図上のマーカーへ描画し、マーカーとイベントの生成・破棄を管理する。
 * 表示内容の更新はReactに任せ、地図の変更時だけマーカーを再生成する。
 */
const AdvancedMarker = ({
  map,
  position,
  title = "",
  children,
  onClick,
  onMouseOver,
  onMouseOut,
}: AdvancedMarkerProps) => {
  const { lat, lng } = position;
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  );
  const [content] = useState(() =>
    typeof document === "undefined" ? null : document.createElement("div"),
  );

  useEffect(() => {
    if (!map || !content) return;

    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      map,
      content,
    });
    markerRef.current = marker;

    return () => {
      window.google.maps.event.clearInstanceListeners(marker);
      marker.map = null;
      markerRef.current = null;
    };
  }, [map, content]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    marker.position = { lat, lng };
  }, [map, content, lat, lng]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    marker.title = title;
  }, [map, content, title]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !content) return;

    if (onClick) marker.addListener("click", onClick);
    if (onMouseOver) content.addEventListener("mouseover", onMouseOver);
    if (onMouseOut) content.addEventListener("mouseout", onMouseOut);

    return () => {
      window.google.maps.event.clearListeners(marker, "click");
      if (onMouseOver) content.removeEventListener("mouseover", onMouseOver);
      if (onMouseOut) content.removeEventListener("mouseout", onMouseOut);
    };
  }, [map, content, onClick, onMouseOver, onMouseOut]);

  return map && content ? createPortal(children, content) : null;
};

export default AdvancedMarker;
