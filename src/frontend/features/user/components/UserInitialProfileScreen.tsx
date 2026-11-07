"use client";
import type { UserProfileUpdateInput } from "~/shared/schemas";
import { useUserInitialProfile } from "~/frontend/features/user/hooks/useUserInitialProfile";
import { InitialProfileForm } from "~/frontend/features/user/components/InitialProfileForm";
type UserInitialProfileScreenProps = { initialValues: UserProfileUpdateInput };
export function UserInitialProfileScreen({
  initialValues,
}: UserInitialProfileScreenProps) {
  const { form, save, isCompleting } = useUserInitialProfile(initialValues);
  return (
    <section className="w-full space-y-6 rounded-xl border bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">初期設定</h1>
        <p className="text-sm text-muted-foreground">
          TABIRUNを利用するためにプロフィールを設定してください。
        </p>
      </header>
      <InitialProfileForm
        form={form}
        onSubmit={save}
        isSubmitting={isCompleting}
      />
    </section>
  );
}
