import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { observable } from "@trpc/server/observable";
import { expect, within } from "storybook/test";
import { api } from "~/trpc/react";
import { RouteDetailsEditScreen } from "./RouteDetailsEditScreen";

const meta = {
  title: "Features/Route/RouteDetailsEditScreen",
  component: RouteDetailsEditScreen,
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    function WithApi(Story) {
      const [queryClient] = useState(() => new QueryClient());
      const [client] = useState(() =>
        api.createClient({
          links: [
            () =>
              ({ op }) =>
                observable((observer) => {
                  // プロフィール・ペースだけをローカルで返し、実APIへ送信しない。
                  observer.next({
                    result: {
                      data:
                        op.path === "pace.getPace"
                          ? [{ id: 1, value: "5:00" }]
                          : null,
                    },
                  });
                  observer.complete();
                }),
          ],
        }),
      );
      return (
        <QueryClientProvider client={queryClient}>
          <api.Provider client={client} queryClient={queryClient}>
            <Story />
          </api.Provider>
        </QueryClientProvider>
      );
    },
  ],
  args: {
    route: {
      id: 1,
      title: "2026/11/24のルート",
      status: "draft",
      directionErrorCode: null,
      direction: {
        directionSource: "routes_api",
        encodedPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
        distanceMeters: 5000,
        duration: "1500s",
        directionCalculatedAt: new Date("2026-11-24T00:00:00Z"),
        directionPointsHash: "a".repeat(64),
        path: [
          { lat: 35, lng: 139 },
          { lat: 36, lng: 140 },
        ],
      },
    },
  },
} satisfies Meta<typeof RouteDetailsEditScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Draft: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "ルート名" })).toHaveValue(
      "2026/11/24のルート",
    );
    await expect(canvas.getByText("距離")).toBeVisible();
    await expect(canvas.getByText("5")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "完了" })).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "ルート作成に戻る" }),
    ).toHaveAttribute("href", "/routes/new");
  },
};
export const Completed: Story = {
  args: { route: { ...meta.args.route, status: "completed" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "保存" })).toBeDisabled();
    await expect(
      canvas.getByRole("link", { name: "ルートに戻る" }),
    ).toHaveAttribute("href", "/routes/1");
  },
};
export const NoDirection: Story = {
  args: {
    route: {
      ...meta.args.route,
      direction: null,
      directionErrorCode: "INTERNAL_SERVER_ERROR",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("距離を表示できません。")).toBeVisible();
    await expect(
      canvas.getByRole("textbox", { name: "ルート名" }),
    ).toBeEnabled();
  },
};
