import { useEffect, useRef } from "react";

interface AdvancedMarkerProps {
  map: google.maps.Map | null;
  options?: google.maps.marker.AdvancedMarkerElementOptions;
  createContent: () => HTMLElement;
  updateContent: (content: HTMLElement) => void;
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onMouseOver?: EventListener;
  onMouseOut?: EventListener;
}

/**
 * 地図の初期化後にDOMとマーカーを生成し、表示の更新と破棄を管理する。
 * createContentには安定した関数を渡す。関数または地図の変更時はマーカーを再生成する。
 */
const AdvancedMarker = ({
  map,
  options = {},
  createContent,
  updateContent,
  onClick,
  onMouseOver,
  onMouseOut,
}: AdvancedMarkerProps) => {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  );
  const contentRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!map) return;

    const content = createContent();
    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      map,
      content,
    });
    markerRef.current = marker;
    contentRef.current = content;

    return () => {
      window.google.maps.event.clearInstanceListeners(marker);
      marker.map = null;
      markerRef.current = null;
      contentRef.current = null;
    };
  }, [map, createContent]);

  useEffect(() => {
    const marker = markerRef.current;
    const content = contentRef.current;
    if (!marker || !content) return;

    Object.assign(marker, options);
    updateContent(content);
  }, [map, createContent, options, updateContent]);

  useEffect(() => {
    const marker = markerRef.current;
    const content = contentRef.current;
    if (!marker || !content) return;

    if (onClick) marker.addListener("click", onClick);
    if (onMouseOver) content.addEventListener("mouseover", onMouseOver);
    if (onMouseOut) content.addEventListener("mouseout", onMouseOut);

    return () => {
      window.google.maps.event.clearListeners(marker, "click");
      if (onMouseOver) content.removeEventListener("mouseover", onMouseOver);
      if (onMouseOut) content.removeEventListener("mouseout", onMouseOut);
    };
  }, [map, createContent, onClick, onMouseOver, onMouseOut]);

  return null;
};

export default AdvancedMarker;
