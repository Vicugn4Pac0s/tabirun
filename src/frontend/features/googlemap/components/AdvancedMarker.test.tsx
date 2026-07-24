import { cleanup, render } from "@testing-library/react";
import type { MutableRefObject } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdvancedMarker from "./AdvancedMarker";

type MarkerMock = {
  map: google.maps.Map | null;
  content: HTMLElement;
  addListener: ReturnType<typeof vi.fn>;
};

const map = {} as google.maps.Map;

let markers: MarkerMock[];
let markerConstructor: ReturnType<typeof vi.fn>;
let clearInstanceListeners: ReturnType<typeof vi.fn>;
let clearListeners: ReturnType<typeof vi.fn>;

beforeEach(() => {
  markers = [];
  markerConstructor = vi.fn(function MockAdvancedMarkerElement({
    map: markerMap,
    content,
  }: {
    map: google.maps.Map;
    content: HTMLElement;
  }) {
    const marker = {
      map: markerMap,
      content,
      addListener: vi.fn(),
    };
    markers.push(marker);
    return marker;
  });
  clearInstanceListeners = vi.fn();
  clearListeners = vi.fn();

  Object.defineProperty(window, "google", {
    configurable: true,
    value: {
      maps: {
        event: {
          clearInstanceListeners,
          clearListeners,
        },
        marker: {
          AdvancedMarkerElement: markerConstructor,
        },
      },
    },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "google");
});

describe("AdvancedMarker", () => {
  it("content変更時に旧イベントを解除し、新しいcontentへ再登録する", () => {
    const markerRef: MutableRefObject<google.maps.marker.AdvancedMarkerElement | null> =
      {
        current: null,
      };
    const initialContent = document.createElement("div");
    const latestContent = document.createElement("div");
    const initialAddEventListener = vi.spyOn(
      initialContent,
      "addEventListener",
    );
    const initialRemoveEventListener = vi.spyOn(
      initialContent,
      "removeEventListener",
    );
    const latestAddEventListener = vi.spyOn(latestContent, "addEventListener");
    const onClick = vi.fn();
    const onMouseOver: EventListener = vi.fn();
    const onMouseOut: EventListener = vi.fn();

    const { rerender } = render(
      <AdvancedMarker
        map={map}
        markerRef={markerRef}
        content={initialContent}
        onClick={onClick}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
      />,
    );

    rerender(
      <AdvancedMarker
        map={map}
        markerRef={markerRef}
        content={latestContent}
        onClick={onClick}
        onMouseOver={onMouseOver}
        onMouseOut={onMouseOut}
      />,
    );

    expect(markerConstructor).toHaveBeenCalledTimes(2);
    expect(initialAddEventListener).toHaveBeenCalledWith(
      "mouseover",
      onMouseOver,
    );
    expect(initialAddEventListener).toHaveBeenCalledWith(
      "mouseout",
      onMouseOut,
    );
    expect(initialRemoveEventListener).toHaveBeenCalledWith(
      "mouseover",
      onMouseOver,
    );
    expect(initialRemoveEventListener).toHaveBeenCalledWith(
      "mouseout",
      onMouseOut,
    );
    expect(latestAddEventListener).toHaveBeenCalledWith(
      "mouseover",
      onMouseOver,
    );
    expect(latestAddEventListener).toHaveBeenCalledWith("mouseout", onMouseOut);
    expect(markers[1]?.addListener).toHaveBeenCalledWith("click", onClick);
  });
});
