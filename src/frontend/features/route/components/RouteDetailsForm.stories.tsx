import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  routeUpdateDetailsSchema,
  type RouteUpdateDetailsInput,
} from "~/shared/schemas";
import { RouteDetailsForm } from "./RouteDetailsForm";

const save = fn();
const editMap = fn();
function Preview({ isSaving = false }: { isSaving?: boolean }) {
  const form = useForm<RouteUpdateDetailsInput>({
    resolver: zodResolver(routeUpdateDetailsSchema),
    defaultValues: { id: 1, title: "2026/11/24のルート" },
    mode: "onChange",
  });
  return (
    <div className="w-full max-w-md p-4">
      <RouteDetailsForm
        form={form}
        onSubmit={form.handleSubmit(save)}
        onEditMap={form.handleSubmit(editMap)}
        isSaving={isSaving}
        canSave={form.formState.isValid}
        submitLabel="完了"
      />
    </div>
  );
}
const meta = {
  title: "Features/Route/RouteDetailsForm",
  component: Preview,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  beforeEach: () => {
    save.mockClear();
    editMap.mockClear();
  },
} satisfies Meta<typeof Preview>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Draft: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "完了" })).toBeEnabled(),
    );
    await userEvent.click(canvas.getByRole("button", { name: "完了" }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    await userEvent.clear(canvas.getByRole("textbox", { name: "ルート名" }));
    await userEvent.click(canvas.getByRole("button", { name: "地図を編集" }));
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "ルート名を入力してください。",
    );
    await expect(editMap).not.toHaveBeenCalled();
  },
};
export const Saving: Story = {
  args: { isSaving: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("textbox", { name: "ルート名" }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: "保存中..." }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: "地図を編集" }),
    ).toBeDisabled();
  },
};
