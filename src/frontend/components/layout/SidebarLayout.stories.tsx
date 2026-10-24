import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "~/frontend/components/ui/button";
import { SidebarLayout } from "./SidebarLayout";

const meta = {
  title: "Layouts/SidebarLayout",
  component: SidebarLayout,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    sidebarTitle: "サイドバー",
    sidebar: (
      <nav aria-label="サンプルメニュー">
        <h2 className="mb-4 font-bold">サイドバー</h2>
        <p>画面固有の情報や操作を配置します。</p>
      </nav>
    ),
    children: (
      <div className="flex min-h-screen min-w-0 flex-1 items-center justify-center bg-gray-100 p-6">
        <p>メインコンテンツ</p>
      </div>
    ),
  },
} satisfies Meta<typeof SidebarLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithTopRight: Story = {
  args: { topRight: <Button variant="outline">アカウント</Button> },
};
