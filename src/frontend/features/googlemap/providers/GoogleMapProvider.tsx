"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type MapContextValue = {
  map: google.maps.Map | null;
  setMap: Dispatch<SetStateAction<google.maps.Map | null>>;
  streetView: React.MutableRefObject<google.maps.StreetViewPanorama | null>;
  streetViewUnavailable: boolean;
  setStreetViewUnavailable: Dispatch<SetStateAction<boolean>>;
};

const GoogleMapContext = createContext<MapContextValue | null>(null);

type Props = {
  children: ReactNode;
};

/**
 * 地図とStreet Viewの参照・利用不可状態を子孫で共有する。
 * 地図とパノラマのインスタンス生成は子コンポーネント側で行う。
 */
export const GoogleMapProvider = ({ children }: Props) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [streetViewUnavailable, setStreetViewUnavailable] = useState(false);
  const streetView = useRef<google.maps.StreetViewPanorama | null>(null);

  const value = useMemo(
    () => ({
      map,
      setMap,
      streetView,
      streetViewUnavailable,
      setStreetViewUnavailable,
    }),
    [map, streetViewUnavailable],
  );

  return (
    <GoogleMapContext.Provider value={value}>
      {children}
    </GoogleMapContext.Provider>
  );
};

/** 地図の共有状態を取得し、GoogleMapProviderの外ではnullを返す。 */
export const useOptionalGoogleMap = () => useContext(GoogleMapContext);

/** 地図の共有状態を取得する。GoogleMapProviderの外で呼ぶとエラーになる。 */
export const useGoogleMap = () => {
  const context = useOptionalGoogleMap();

  if (!context) {
    throw new Error("useGoogleMap must be used within GoogleMapProvider");
  }

  return context;
};
