type MapCenter = {
  lat: number;
  lng: number;
};

type UserHomeLocation =
  | {
      homeLat: number | null;
      homeLng: number | null;
    }
  | null
  | undefined;

export const getDefaultCenter = (
  user: UserHomeLocation,
  fallbackCenter: MapCenter,
): MapCenter => {
  if (user?.homeLat != null && user.homeLng != null) {
    return { lat: user.homeLat, lng: user.homeLng };
  }

  return fallbackCenter;
};
