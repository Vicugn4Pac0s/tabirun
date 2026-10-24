import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import RouteMenuButton from "./RouteMenuButton";

const meta = {
  title: "Features/Route/RouteMenuButton",
  component: RouteMenuButton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { className: "md:flex", onClick: fn() },
  decorators: [
    (Story) => (
      <div className="relative h-80 w-80 rounded-lg border bg-gray-50">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RouteMenuButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Menu: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "メニューを開く",
    });
    await expect(button).toHaveTextContent("MENU");
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
export const Measuring: Story = { args: { label: "MEASURING" } };
export const Distance: Story = { args: { label: "5.2 km" } };
export const Disabled: Story = { args: { label: "5.2 km", disabled: true } };
