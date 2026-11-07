import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
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

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const main = within(canvasElement).getByRole("main");
    const container = within(main).getByText("ページの内容").parentElement;
    if (!container) throw new Error("コンテナがありません");
    await expect(main).toBeVisible();
    await expect(getComputedStyle(container).maxWidth).toBe("512px");
    await expect(getComputedStyle(container).paddingTop).toBe("40px");
    await expect(getComputedStyle(container).paddingLeft).toBe("16px");
  },
};

export const VerticallyCentered: Story = {
  args: { className: "flex min-h-screen items-center" },
  play: async ({ canvasElement }) => {
    const main = within(canvasElement).getByRole("main");
    const container = within(main).getByText("ページの内容").parentElement;
    if (!container) throw new Error("コンテナがありません");
    await expect(getComputedStyle(container).display).toBe("flex");
    await expect(getComputedStyle(container).alignItems).toBe("center");
    await expect(
      container.getBoundingClientRect().height,
    ).toBeGreaterThanOrEqual(window.innerHeight);
  },
};

export const Mobile: Story = {
  decorators: [
    (Story) => (
      <div data-testid="mobile-page" style={{ width: 375, maxWidth: "100%" }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const mobile = canvas.getByTestId("mobile-page");
    const main = canvas.getByRole("main");
    const container = within(main).getByText("ページの内容").parentElement;
    if (!container) throw new Error("コンテナがありません");
    await expect(container.getBoundingClientRect().width).toBe(
      mobile.getBoundingClientRect().width,
    );
    await expect(mobile.scrollWidth).toBeLessThanOrEqual(mobile.clientWidth);
  },
};
