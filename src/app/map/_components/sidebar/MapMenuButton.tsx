"use client";

import { forwardRef } from "react";
import type { ButtonProps } from "~/frontend/components/ui/button";
import RouteMenuButton from "~/frontend/features/route/components/RouteMenuButton";
import { useMapMenuButtonState } from "./hooks/useMapMenuButtonState";

const MapMenuButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const { label, ariaLabel } = useMapMenuButtonState();
    return (
      <RouteMenuButton
        ref={ref}
        label={label}
        aria-label={ariaLabel}
        {...props}
      />
    );
  },
);
MapMenuButton.displayName = "MapMenuButton";
export default MapMenuButton;
