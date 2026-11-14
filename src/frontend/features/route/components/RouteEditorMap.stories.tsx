import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, within } from "storybook/test";
import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { RouteEditorMap } from "./RouteEditorMap";

const meta = {
  title: "Features/Route/RouteEditorMap",
  component: RouteEditorMap,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <GoogleMapProvider>
        <div className="flex min-h-screen">
          <Story />
        </div>
      </GoogleMapProvider>
    ),
  ],
  args: {
    initialCenter: { lat: 35.68, lng: 139.76 },
    points: [],
    polylinePath: null,
    isLoading: false,
    disabled: false,
    onTogglePoint: fn(),
  },
} satisfies Meta<typeof RouteEditorMap>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const AtLimit: Story = {
  args: {
    points: Array.from({ length: 27 }, (_, i) => ({
      lat: 35.68 + i / 1000,
      lng: 139.76,
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("status", { name: "ルートの地点数" }),
    ).toHaveTextContent("地点 27 / 27");
    await expect(canvas.getByText("1ルート27地点までです")).toBeVisible();
  },
};
