import type { FormEvent, ReactNode } from "react";
import { FormField } from "~/frontend/components/app-ui/FormField";
import { Button } from "~/frontend/components/ui/button";
import { Input } from "~/frontend/components/ui/input";
import type { useRouteDraft } from "../hooks/useRouteDraft";

type RouteFormProps = {
  draft: Pick<
    ReturnType<typeof useRouteDraft>,
    "form" | "isDirty" | "canSave" | "isSubmitting" | "reset"
  >;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  submitText: { idle: string; pending: string };
  children: ReactNode;
};

/**
 * 編集用draftを使って名前入力と保存・リセット操作を表示する。
 * 名前のエラーは入力済みか送信後に表示し、送信中は入力・操作を無効にする。
 */
export function RouteForm({
  draft,
  onSubmit,
  submitText,
  children,
}: RouteFormProps) {
  const { form, isSubmitting } = draft;
  const titleError = form.formState.errors.title?.message;
  const showTitleError =
    Boolean(titleError) &&
    (form.formState.touchedFields.title === true || form.formState.isSubmitted);

  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
    >
      <FormField
        label="ルート名"
        error={showTitleError ? titleError : undefined}
      >
        {(fieldProps) => (
          <Input
            {...fieldProps}
            disabled={isSubmitting}
            {...form.register("title")}
          />
        )}
      </FormField>
      {children}
      <div className="my-6 flex gap-2">
        <Button type="submit" disabled={!draft.canSave || isSubmitting}>
          {isSubmitting ? submitText.pending : submitText.idle}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!draft.isDirty || isSubmitting}
          onClick={draft.reset}
        >
          リセット
        </Button>
      </div>
    </form>
  );
}
