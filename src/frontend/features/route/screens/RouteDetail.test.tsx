import userEvent from "@testing-library/user-event";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteDetail } from "./RouteDetail";
import type { ComponentProps } from "react";
import type RouteMapView from "../components/RouteMapView";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";

const { remove, deletionStatus, renderMapView } = vi.hoisted(() => ({
  remove: vi.fn(),
  deletionStatus: { isDeleting: false },
  renderMapView: vi.fn(),
}));
vi.mock("../hooks/useRouteDelete", () => ({
  useRouteDelete: () => ({ remove, isDeleting: deletionStatus.isDeleting }),
}));
vi.mock("../components/RouteMapView", () => ({
  default: (props: ComponentProps<typeof RouteMapView>) => {
    renderMapView(props);
    return <div role="region" aria-label="ルートの地図" />;
  },
}));
vi.mock("~/frontend/features/user/api/useCurrentUserQuery", () => ({
  useCurrentUserQuery: () => ({ user: { pace: "5:00", weight: 60 } }),
}));
vi.mock("~/frontend/features/pace/components/PaceSelect", () => ({
  default: () => <span>設定ペース</span>,
}));
const route = {
  id: 1,
  title: "朝のルート",
  direction: null,
  points: [
    { lat: 35, lng: 135 },
    { lat: 36, lng: 136 },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
  deletionStatus.isDeleting = false;
});
afterEach(cleanup);

describe("RouteDetail", () => {
  it("経路がなくても始終点の地図と下見・編集へのリンクを表示する", () => {
    render(<RouteDetail route={route} />);
    expect(
      screen.getByRole("heading", { name: "朝のルート" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Street Viewで道を見る" }),
    ).toHaveAttribute("href", "/routes/1/preview");
    expect(screen.getByRole("link", { name: "地図を編集" })).toHaveAttribute(
      "href",
      "/routes/1/edit",
    );
    expect(screen.getByRole("link", { name: "詳細を編集" })).toHaveAttribute(
      "href",
      "/routes/1/details",
    );
    expect(screen.getByText("距離を表示できません。")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "ルートの地図" }),
    ).toBeInTheDocument();
    expect(renderMapView).toHaveBeenCalledWith(
      expect.objectContaining({
        initialCenter: route.points[0],
        path: null,
        fitToRoute: true,
        markers: [
          expect.objectContaining({ position: route.points[0], label: "S" }),
          expect.objectContaining({ position: route.points[1], label: "G" }),
        ],
      }),
    );
    expect(renderMapView.mock.lastCall?.[0]).not.toHaveProperty(
      "showStreetView",
      true,
    );
  });
  it("保存済みの距離とプロフィールから試算を表示する", () => {
    render(
      <RouteDetail
        route={{
          ...route,
          direction: {
            directionSource: "routes_api",
            encodedPolyline: "saved",
            distanceMeters: 5200,
            duration: "1800s",
            directionCalculatedAt: new Date(),
            directionPointsHash: "hash",
            path: [
              { lat: 35, lng: 135 },
              { lat: 36, lng: 136 },
            ],
          },
        }}
      />,
    );
    expect(screen.getByText("5.2")).toBeInTheDocument();
    expect(screen.getByText("予想時間")).toBeInTheDocument();
    expect(screen.getByText("消費カロリー")).toBeInTheDocument();
    expect(renderMapView).toHaveBeenCalledWith(
      expect.objectContaining({ path: route.points }),
    );
  });
  it("地点も経路もない場合は既定の中心で地図だけを表示する", () => {
    render(<RouteDetail route={{ ...route, points: [] }} />);
    expect(renderMapView).toHaveBeenCalledWith(
      expect.objectContaining({
        initialCenter: GOOGLE_MAP_DEFAULT_CENTER,
        path: null,
        markers: [],
      }),
    );
  });
  it("削除を通知し、削除中は編集とプレビューへの移動を抑止する", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<RouteDetail route={route} />);
    await user.click(screen.getByRole("button", { name: "削除する" }));
    expect(remove).toHaveBeenCalledOnce();
    deletionStatus.isDeleting = true;
    rerender(<RouteDetail route={route} />);
    expect(screen.getByRole("button", { name: "削除中..." })).toBeDisabled();
    for (const name of ["地図を編集", "詳細を編集", "Street Viewで道を見る"]) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("aria-disabled", "true");
      expect(
        link.dispatchEvent(
          new MouseEvent("click", { bubbles: true, cancelable: true }),
        ),
      ).toBe(false);
    }
  });
});
