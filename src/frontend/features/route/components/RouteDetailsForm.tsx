import type { FormEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FormField } from "~/frontend/components/app-ui/FormField";
import { Button } from "~/frontend/components/ui/button";
import { Input } from "~/frontend/components/ui/input";
import type { RouteUpdateDetailsInput } from "~/shared/schemas";

type RouteDetailsFormProps = {
  form: UseFormReturn<RouteUpdateDetailsInput>;
  onSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  onEditMap: () => Promise<void>;
  isSaving: boolean;
  canSave: boolean;
  submitLabel: string;
};

/** 名前入力と保存・地図編集への操作を表示する。送信中は入力と両操作を無効にする。 */
export function RouteDetailsForm({
  form,
  onSubmit,
  onEditMap,
  isSaving,
  canSave,
  submitLabel,
}: RouteDetailsFormProps) {
  const { errors, touchedFields, isSubmitted } = form.formState;
  const error =
    touchedFields.title || isSubmitted ? errors.title?.message : undefined;
  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="space-y-6"
    >
      <FormField label="ルート名" error={error}>
        {(fieldProps) => (
          <Input
            {...fieldProps}
            {...form.register("title")}
            disabled={isSaving}
          />
        )}
      </FormField>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSaving || !canSave}>
          {isSaving ? "保存中..." : submitLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={() => {
            void onEditMap();
          }}
        >
          地図を編集
        </Button>
      </div>
    </form>
  );
}
