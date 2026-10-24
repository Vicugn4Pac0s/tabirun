import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RouteNavigation } from "./RouteNavigation";

const points = [
  { lat: 35, lng: 135 },
  { lat: 36, lng: 136 },
  { lat: 37, lng: 137 },
];
afterEach(cleanup);
describe("RouteNavigation", () => {
  it("登録地点では前後・先頭・末尾へ移動し、削除操作を通知する", async () => {
    const onMove = vi.fn();
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <RouteNavigation
        points={points}
        currentPoint={points[1]!}
        onMove={onMove}
        onToggle={onToggle}
      />,
    );
    for (const [name, point] of [
      ["最初へ", points[0]],
      ["前へ", points[0]],
      ["次へ", points[2]],
      ["最後へ", points[2]],
    ] as const) {
      await user.click(screen.getByRole("button", { name }));
      expect(onMove).toHaveBeenLastCalledWith(point);
    }
    await user.click(screen.getByRole("button", { name: "地点を削除" }));
    expect(onToggle).toHaveBeenCalledOnce();
  });
  it("未登録地点では追加でき、Enterで操作するが入力中は操作しない", () => {
    const onToggle = vi.fn();
    render(
      <>
        <input aria-label="ルート名" />
        <RouteNavigation
          points={points}
          currentPoint={{ lat: 38, lng: 138 }}
          onMove={vi.fn()}
          onToggle={onToggle}
        />
      </>,
    );
    expect(screen.getByRole("button", { name: "地点を追加" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "次へ" })).toBeDisabled();
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onToggle).toHaveBeenCalledOnce();
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(onToggle).toHaveBeenCalledOnce();
  });
  it("閲覧時は地点を変えられず、既存の移動操作は使える", () => {
    const onToggle = vi.fn();
    render(
      <RouteNavigation
        points={points}
        currentPoint={points[0]!}
        onMove={vi.fn()}
        onToggle={onToggle}
        canEdit={false}
      />,
    );
    expect(screen.getByRole("button", { name: "地点を削除" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "次へ" })).toBeEnabled();
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onToggle).not.toHaveBeenCalled();
  });
  it("保存中はすべての操作とEnterを無効にする", () => {
    const onToggle = vi.fn();
    render(
      <RouteNavigation
        points={points}
        currentPoint={points[1]!}
        onMove={vi.fn()}
        onToggle={onToggle}
        disabled
      />,
    );
    for (const button of screen.getAllByRole("button"))
      expect(button).toBeDisabled();
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onToggle).not.toHaveBeenCalled();
  });
});
