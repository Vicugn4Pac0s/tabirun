"use client";

import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function Providers({ children }: Props) {
  return (
    <GoogleMapProvider>
      {children}
    </GoogleMapProvider>
  );
}