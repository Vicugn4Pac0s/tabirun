import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Button } from "~/frontend/components/ui/button";
import { ResponsivePanel } from "./ResponsivePanel";

const meta = {
  title: "App UI/ResponsivePanel",
  component: ResponsivePanel,
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
  args: {
    title: "表示設定",
    open: true,
    onOpenChange: fn(),
    children: (
      <div className="space-y-4">
        <p>PCでは右側、モバイルでは画面下部に表示されます。</p>
        <label className="flex items-center gap-2">
          <input type="checkbox" />
          詳細を表示する
        </label>
      </div>
    ),
  },
  render: function Render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <div className="min-h-screen bg-muted p-6">
        <Button
          variant="outline"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          表示設定を{open ? "閉じる" : "開く"}
        </Button>
        <ResponsivePanel
          {...args}
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            args.onOpenChange(value);
          }}
        />
      </div>
    );
  },
} satisfies Meta<typeof ResponsivePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
