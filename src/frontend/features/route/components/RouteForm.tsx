import type { ReactNode } from "react";
import { Button } from "~/frontend/components/ui/button";
import { Input } from "~/frontend/components/ui/input";
import type { useRouteDraft } from "../hooks/useRouteDraft";

type RouteFormProps = {
  draft: Pick<
    ReturnType<typeof useRouteDraft>,
    "form" | "isDirty" | "canSave" | "reset"
  >;
  onSubmit: () => Promise<void>;
  isSaving: boolean;
  submitText: { idle: string; pending: string };
  children: ReactNode;
};

export function RouteForm({
  draft,
  onSubmit,
  isSaving,
  submitText,
  children,
}: RouteFormProps) {
  const { form } = draft;
  const titleError = form.formState.errors.title?.message;
  const showTitleError =
    Boolean(titleError) &&
    (form.formState.touchedFields.title === true || form.formState.isSubmitted);

  return (
    <form
      onSubmit={(event) => {
        void form.handleSubmit(onSubmit)(event);
      }}
    >
      <label className="block text-sm font-medium">
        <span className="mb-2 block">ルート名</span>
        <Input
          disabled={isSaving}
          aria-invalid={showTitleError}
          aria-describedby={showTitleError ? "route-title-error" : undefined}
          {...form.register("title")}
        />
      </label>
      {showTitleError && (
        <p
          id="route-title-error"
          role="alert"
          className="mt-1 text-sm text-red-600"
        >
          {titleError}
        </p>
      )}
      {children}
      <div className="my-6 flex gap-2">
        <Button
          type="submit"
          disabled={!draft.canSave || isSaving || form.formState.isSubmitting}
        >
          {isSaving || form.formState.isSubmitting
            ? submitText.pending
            : submitText.idle}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!draft.isDirty || isSaving || form.formState.isSubmitting}
          onClick={draft.reset}
        >
          リセット
        </Button>
      </div>
    </form>
  );
}
