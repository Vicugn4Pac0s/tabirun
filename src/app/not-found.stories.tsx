import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import NotFound from "./not-found";

const meta = {
  title: "App/NotFound",
  component: NotFound,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NotFound>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "ページが見つかりません" }),
    ).toBeVisible();
    const home = canvas.getByRole("link", { name: "ホームへ戻る" });
    await expect(home).toHaveAttribute("href", "/");
    await userEvent.tab();
    await expect(home).toHaveFocus();
  },
};
export const Mobile: Story = {
  decorators: [
    (Story) => (
      <div
        data-testid="mobile-not-found"
        style={{ width: 375, maxWidth: "100%" }}
      >
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("link", { name: "ホームへ戻る" }),
    ).toBeVisible();
    const mobile = canvas.getByTestId("mobile-not-found");
    await expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.clientWidth);
  },
};
