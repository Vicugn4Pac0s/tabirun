import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageContainer } from "./PageContainer";

const meta = {
  title: "App UI/PageContainer",
  component: PageContainer,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <main>
        <Story />
      </main>
    ),
  ],
  args: {
    children: <div className="w-full rounded-xl border p-6">ページの内容</div>,
  },
} satisfies Meta<typeof PageContainer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
