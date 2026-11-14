import { useEffect, useState } from "react";

/** 画面幅767px以下かを購読する。初回描画ではfalseを返し、マウント後に実際の幅を反映する。 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => setIsMobile(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener?.("change", updateViewport);
    return () => mediaQuery.removeEventListener?.("change", updateViewport);
  }, []);

  return isMobile;
}
