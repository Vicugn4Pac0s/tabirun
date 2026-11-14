import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { RoutePointCount } from "./RoutePointCount";

const meta = {
  title: "Features/Route/RoutePointCount",
  component: RoutePointCount,
  args: { count: 12 },
  tags: ["autodocs"],
} satisfies Meta<typeof RoutePointCount>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { count: 0 } };
export const AtLimit: Story = {
  args: { count: 27 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("status", { name: "ルートの地点数" }),
    ).toHaveTextContent("地点 27 / 27");
    await expect(canvas.getByText("1ルート27地点までです")).toBeVisible();
  },
};
