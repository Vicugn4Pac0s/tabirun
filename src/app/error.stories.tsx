import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import ErrorPage from "./error";

const meta = {
  title: "App/Error",
  component: ErrorPage,
  parameters: { layout: "fullscreen" },
  args: { error: new Error("internal-error-detail"), reset: fn() },
} satisfies Meta<typeof ErrorPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "エラーが発生しました" }),
    ).toBeVisible();
    await expect(
      canvas.queryByText("internal-error-detail"),
    ).not.toBeInTheDocument();
    const retry = canvas.getByRole("button", { name: "もう一度試す" });
    await userEvent.tab();
    await expect(retry).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(args.reset).toHaveBeenCalledOnce();
    await expect(
      canvas.getByRole("link", { name: "ホームへ戻る" }),
    ).toHaveAttribute("href", "/");
  },
};
export const Mobile: Story = {
  decorators: [
    (Story) => (
      <div data-testid="mobile-error" style={{ width: 375, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "もう一度試す" }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "ホームへ戻る" }),
    ).toBeVisible();
    const mobile = canvas.getByTestId("mobile-error");
    await expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.clientWidth);
  },
};
