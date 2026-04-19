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
};

const GoogleMapContext = createContext<MapContextValue | null>(null);

type Props = {
  children: ReactNode;
};

export const GoogleMapProvider = ({ children }: Props) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const streetView = useRef<google.maps.StreetViewPanorama | null>(null);

  const value = useMemo(
    () => ({
      map,
      setMap,
      streetView,
    }),
    [map]
  );

  return <GoogleMapContext.Provider value={value}>{children}</GoogleMapContext.Provider>;
};

export const useGoogleMap = () => {
  const context = useContext(GoogleMapContext);

  if (!context) {
    throw new Error("useGoogleMap must be used within GoogleMapProvider");
  }

  return context;
};