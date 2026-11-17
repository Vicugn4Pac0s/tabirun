import type { ReactElement, ReactNode } from "react";
import type * as MapsWrapper from "@googlemaps/react-wrapper";
import { cleanup, render, screen } from "@testing-library/react";
import { Status } from "@googlemaps/react-wrapper";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GoogleMapView from "./GoogleMapView";

const { loadingStatus, canvasProps, wrapperProps } = vi.hoisted(() => ({
  loadingStatus: { value: "LOADING" },
  canvasProps: vi.fn(),
  wrapperProps: vi.fn(),
}));

vi.mock("~/env", () => ({
  env: {
    NEXT_PUBLIC_GOOGLE_MAP_API_KEY: "test-api-key",
    NEXT_PUBLIC_GOOGLE_MAP_ID: "test-map-id",
  },
}));
vi.mock("@googlemaps/react-wrapper", async (importOriginal) => ({
  ...(await importOriginal<typeof MapsWrapper>()),
  Wrapper: ({
    render: renderStatus,
    children,
    apiKey,
  }: {
    render: (status: Status) => ReactElement;
    children: ReactNode;
    apiKey: string;
  }) => {
    wrapperProps({ apiKey });
    return loadingStatus.value === "SUCCESS"
      ? children
      : renderStatus(
          loadingStatus.value === "LOADING" ? Status.LOADING : Status.FAILURE,
        );
  },
}));
vi.mock("./GoogleMapCanvas", () => ({
  default: (props: { options: google.maps.MapOptions }) => {
    canvasProps(props);
    return <div aria-label="地図" />;
  },
}));

beforeEach(() => {
  loadingStatus.value = "LOADING";
  vi.clearAllMocks();
});
afterEach(cleanup);

function renderMap(isLoading = false) {
  return render(
    <GoogleMapView
      map={null}
      setMap={vi.fn()}
      options={{}}
      isLoading={isLoading}
    />,
  );
}

describe("GoogleMapView", () => {
  it("APIの認証キーと地図のMap IDを分け、optionsでもMap IDを上書きさせない", () => {
    loadingStatus.value = "SUCCESS";
    render(
      <GoogleMapView
        map={null}
        setMap={vi.fn()}
        options={{ zoom: 16, mapId: "other-map-id" }}
      />,
    );
    expect(wrapperProps).toHaveBeenCalledWith({ apiKey: "test-api-key" });
    expect(canvasProps).toHaveBeenCalledWith(
      expect.objectContaining({ options: { zoom: 16, mapId: "test-map-id" } }),
    );
  });
  it("API読込中は読み込み表示を出し、エラーを表示しない", () => {
    renderMap();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("API読込失敗時は日本語のエラーを通知する", () => {
    loadingStatus.value = "FAILURE";
    renderMap();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "地図を読み込めませんでした。時間をおいて再度お試しください。",
    );
    expect(screen.getByRole("alert")).toHaveClass("text-destructive");
    expect(screen.queryByText("FAILURE")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("API読込成功時は地図を表示し、計算中だけオーバーレイを表示する", () => {
    loadingStatus.value = "SUCCESS";
    const { rerender } = renderMap();
    expect(screen.getByLabelText("地図")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    rerender(
      <GoogleMapView map={null} setMap={vi.fn()} options={{}} isLoading />,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
