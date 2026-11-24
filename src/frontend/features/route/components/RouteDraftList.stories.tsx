import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { observable } from "@trpc/server/observable";
import { TRPCClientError } from "@trpc/client";
import { expect, within } from "storybook/test";
import { api, type RouterOutputs } from "~/trpc/react";
import { RouteDraftList } from "./RouteDraftList";

const drafts = [
  {
    id: 42,
    title: "2026/11/24のルート",
    createdById: "owner",
    createdAt: new Date("2026-11-24T00:00:00Z"),
    updatedAt: null,
  },
] satisfies RouterOutputs["route"]["getDrafts"];
const meta = {
  title: "Features/Route/RouteDraftList",
  component: RouteDraftList,
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    function WithApi(Story, context) {
      const [queryClient] = useState(
        () =>
          new QueryClient({ defaultOptions: { queries: { retry: false } } }),
      );
      const [client] = useState(() =>
        api.createClient({
          links: [
            () => () =>
              observable((observer) => {
                if (context.parameters.draftState === "loading") return;
                if (context.parameters.draftState === "error") {
                  observer.error(new TRPCClientError("story error"));
                  return;
                }
                observer.next({
                  result: {
                    data:
                      context.parameters.draftState === "empty" ? [] : drafts,
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
            <div className="w-72 max-w-full p-4">
              <Story />
            </div>
          </api.Provider>
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta<typeof RouteDraftList>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Resumable: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("link", { name: "2026/11/24のルート" }),
    ).toHaveAttribute("href", "/routes/42/details");
  },
};
export const Empty: Story = {
  parameters: { draftState: "empty" },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByText(/作成途中のルートはありません/),
    ).toBeVisible();
  },
};
export const Loading: Story = {
  parameters: { draftState: "loading" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("status")).toHaveTextContent(
      "読み込み中",
    );
  },
};
export const Error: Story = {
  parameters: { draftState: "error" },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("alert"),
    ).toHaveTextContent("下書きを取得できませんでした。");
  },
};
