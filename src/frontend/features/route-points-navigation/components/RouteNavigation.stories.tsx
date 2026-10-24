import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { RouteNavigation } from "./RouteNavigation";

const points = [
  { lat: 35, lng: 135 },
  { lat: 36, lng: 136 },
  { lat: 37, lng: 137 },
];
const meta = {
  title: "Features/RoutePoints/RouteNavigation",
  component: RouteNavigation,
  parameters: { layout: "centered" },
  args: { points, currentPoint: points[0]!, onMove: fn(), onToggle: fn() },
  tags: ["autodocs"],
} satisfies Meta<typeof RouteNavigation>;
export default meta;
type Story = StoryObj<typeof meta>;
export const RegisteredPoint: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "最初へ" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "次へ" }));
    await expect(args.onMove).toHaveBeenCalledWith(points[1]);
    await userEvent.click(canvas.getByRole("button", { name: "地点を削除" }));
    await expect(args.onToggle).toHaveBeenCalledTimes(1);
  },
};
export const NewPoint: Story = {
  args: { currentPoint: { lat: 38, lng: 138 } },
};
export const Saving: Story = { args: { disabled: true } };
export const ReadOnly: Story = { args: { canEdit: false } };

export const EmptyRoute: Story = {
  args: { points: [] },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "次へ" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: "地点を追加" }));
    await expect(args.onToggle).toHaveBeenCalledTimes(1);
  },
};
