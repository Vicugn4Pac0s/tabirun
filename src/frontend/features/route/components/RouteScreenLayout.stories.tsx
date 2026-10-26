import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SessionProvider } from "next-auth/react";

import { RouteScreenLayout } from "./RouteScreenLayout";

const meta = {
  title: "Features/Route/RouteScreenLayout",
  component: RouteScreenLayout,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <Story />
      </SessionProvider>
    ),
  ],
  args: {
    panelTitle: "ルート情報",
    menuTriggerLabel: "5.2 km",
    panel: (
      <div>
        <h2 className="mb-4 font-bold">ルート情報</h2>
        <p>画面固有の情報や操作を配置します。</p>
      </div>
    ),
    children: (
      <div className="flex min-h-screen min-w-0 flex-1 items-center justify-center bg-gray-100 p-6">
        <p>地図領域</p>
      </div>
    ),
  },
} satisfies Meta<typeof RouteScreenLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
