import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
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
export const RegisteredPoint: Story = {};
export const NewPoint: Story = {
  args: { currentPoint: { lat: 38, lng: 138 } },
};

const fullPoints = Array.from({ length: 27 }, (_, i) => ({
  lat: 35 + i / 100,
  lng: 135,
}));
export const AtLimit: Story = {
  args: { points: fullPoints, currentPoint: { lat: 38, lng: 138 } },
};
