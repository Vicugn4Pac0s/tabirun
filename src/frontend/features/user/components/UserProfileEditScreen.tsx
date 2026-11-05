"use client";

import Link from "next/link";
import { useController } from "react-hook-form";
import { Button } from "~/frontend/components/ui/button";
import { UserProfileFormFields } from "~/frontend/features/user/components/UserProfileFormFields";
import { useUserProfileEdit } from "~/frontend/features/user/hooks/useUserProfileEdit";
import type { UserProfileUpdateInput } from "~/shared/schemas";

type UserProfileEditScreenProps = { initialValues: UserProfileUpdateInput };

export function UserProfileEditScreen({
  initialValues,
}: UserProfileEditScreenProps) {
  const { form, save, isUpdating } = useUserProfileEdit(initialValues);
  const { field: gender } = useController({
    control: form.control,
    name: "gender",
  });
  const { field: pace } = useController({
    control: form.control,
    name: "pace",
  });
  return (
    <section className="space-y-6 rounded-xl border bg-white p-6 shadow-sm">
      <Link href="/" className="inline-block font-medium underline">
        ホームへ戻る
      </Link>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">プロフィールを編集</h1>
        <p className="text-sm text-muted-foreground">
          任意のプロフィール情報を更新できます。
        </p>
      </header>
      <form className="space-y-4" onSubmit={save}>
        <UserProfileFormFields
          register={form.register}
          gender={gender}
          pace={pace}
          errors={form.formState.errors}
          disabled={isUpdating}
        />
        <Button type="submit" className="w-full" disabled={isUpdating}>
          {isUpdating ? "更新中..." : "保存する"}
        </Button>
      </form>
    </section>
  );
}
