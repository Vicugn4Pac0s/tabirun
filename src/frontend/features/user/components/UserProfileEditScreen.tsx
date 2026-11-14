"use client";

import Link from "next/link";
import { UserProfileEditForm } from "~/frontend/features/user/components/UserProfileEditForm";
import { useUserProfileEdit } from "~/frontend/features/user/hooks/useUserProfileEdit";
import type { UserProfileUpdateInput } from "~/shared/schemas";

type UserProfileEditScreenProps = { initialValues: UserProfileUpdateInput };

/**
 * プロフィールの編集フォームとホームへのリンクを表示する。
 * 保存成功時はホームへ遷移して再取得し、失敗時は入力を保ってtoastを表示する。
 */
export function UserProfileEditScreen({
  initialValues,
}: UserProfileEditScreenProps) {
  const { form, save, isUpdating } = useUserProfileEdit(initialValues);
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
      <UserProfileEditForm
        form={form}
        onSubmit={save}
        isSubmitting={isUpdating}
      />
    </section>
  );
}
