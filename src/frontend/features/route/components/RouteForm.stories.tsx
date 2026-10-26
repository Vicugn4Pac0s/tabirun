import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { useRouteDraft } from "../hooks/useRouteDraft";
import { RouteForm } from "./RouteForm";

function RouteFormPreview({ editing = false }: { editing?: boolean }) {
  return (
    <RouteFormExample key={editing ? "edit" : "create"} editing={editing} />
  );
}

function RouteFormExample({ editing }: { editing: boolean }) {
  const draft = useRouteDraft(
    editing
      ? {
          title: "朝のルート",
          points: [
            { lat: 35, lng: 135 },
            { lat: 36, lng: 136 },
          ],
        }
      : { title: "", points: [] },
    false,
  );

  return (
    <div className="w-72 max-w-full">
      <RouteForm
        draft={draft}
        onSubmit={async () => undefined}
        isSaving={false}
        submitText={
          editing
            ? { idle: "更新する", pending: "更新中..." }
            : { idle: "ルートを保存する", pending: "保存中..." }
        }
      >
        <p className="mt-2 text-sm text-gray-500">
          経由地点を地図から登録します。
        </p>
      </RouteForm>
    </div>
  );
}

const meta = {
  title: "Features/Route/RouteForm",
  component: RouteFormPreview,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof RouteFormPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  args: { editing: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: "ルート名" })).toHaveValue(
      "",
    );
    await expect(
      canvas.getByRole("button", { name: "ルートを保存する" }),
    ).toBeDisabled();
  },
};

export const Edit: Story = {
  args: { editing: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(
      canvas.getByRole("textbox", { name: "ルート名" }),
      "変更",
    );
    await expect(canvas.getByRole("textbox", { name: "ルート名" })).toHaveValue(
      "朝のルート変更",
    );
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "更新する" })).toBeEnabled(),
    );
  },
};
