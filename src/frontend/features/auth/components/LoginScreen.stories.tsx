import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { LoginScreen } from "./LoginScreen";

const meta = {
  title: "Features/Auth/LoginScreen",
  component: LoginScreen,
  args: { returnTo: "/routes/new" },
  decorators: [
    (Story) => (
      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof LoginScreen>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const login = canvas.getByRole("button", { name: "Googleでログイン" });
    await userEvent.tab();
    await expect(login).toHaveFocus();
    await expect(login).toBeEnabled();
    await expect(
      canvas.getByRole("link", { name: "ホームへ戻る" }),
    ).toHaveAttribute("href", "/");
  },
};
export const Mobile: Story = {
  decorators: [
    (Story) => (
      <div data-testid="mobile-login" style={{ width: 375, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "ログインが必要です" }),
    ).toBeVisible();
    const mobile = canvas.getByTestId("mobile-login");
    await expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.clientWidth);
  },
};
