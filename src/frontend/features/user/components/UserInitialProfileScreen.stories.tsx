import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { observable } from "@trpc/server/observable";
import { useState, type ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";
import { api } from "~/trpc/react";
import { UserInitialProfileScreen } from "./UserInitialProfileScreen";

function ProfilePreviewProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [client] = useState(() =>
    api.createClient({
      links: [
        () =>
          ({ op }) =>
            observable((observer) => {
              // Story内で完結させ、実際のプロフィールAPIへ接続しない。
              observer.next({
                result: {
                  data:
                    op.path === "pace.getPace"
                      ? [{ value: "6:00" }, { value: "5:00" }]
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
        {children}
      </api.Provider>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/User/UserInitialProfileScreen",
  component: UserInitialProfileScreen,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <ProfilePreviewProvider>
        <main className="mx-auto w-full max-w-lg px-4 py-10">
          <Story />
        </main>
      </ProfilePreviewProvider>
    ),
  ],
  args: {
    initialValues: {
      birthDate: "1990-01-01",
      gender: "male",
      pace: "6:00",
      height: 170,
      weight: 60,
    },
  },
} satisfies Meta<typeof UserInitialProfileScreen>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "初期設定を完了" }),
    ).toBeEnabled();
    const height = canvas.getAllByRole("spinbutton")[0];
    if (!height) throw new Error("身長の入力欄がありません");
    await userEvent.clear(height);
    await userEvent.type(height, "175");
    await expect(height).toHaveValue(175);
  },
};

export const Mobile: Story = {
  decorators: [
    (Story) => (
      <div
        data-testid="mobile-profile"
        style={{ width: 375, maxWidth: "100%" }}
      >
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "初期設定を完了" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("heading", { name: "初期設定" }),
    ).toBeVisible();
    const mobile = canvas.getByTestId("mobile-profile");
    await expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.clientWidth);
  },
};
