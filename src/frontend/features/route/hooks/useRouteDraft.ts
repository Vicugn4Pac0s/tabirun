import { useState } from "react";

type InitialRouteDraft = {
  title: string | null;
  points: google.maps.LatLngLiteral[];
};

export function useRouteDraft(initialRoute: InitialRouteDraft) {
  const [title, setTitle] = useState(initialRoute.title ?? "");
  const [points] = useState(() =>
    initialRoute.points.map((point) => ({ ...point })),
  );

  return { title, setTitle, points };
}
