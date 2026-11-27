"use client";

import type { ComponentProps } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/frontend/components/ui/dialog";
import { GuardedLink } from "~/frontend/providers/GuardedLink";
import { useRouteDraftsQuery } from "../api/useRouteDraftsQuery";

type RouteDraftDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus?: ComponentProps<typeof DialogContent>["onCloseAutoFocus"];
};

/** 下書き一覧を開いた時に取得し、選んだルートの詳細入力へ進むダイアログを表示する。 */
export function RouteDraftDialog({
  open,
  onOpenChange,
  onCloseAutoFocus,
}: RouteDraftDialogProps) {
  const { drafts, isLoading, error } = useRouteDraftsQuery({ enabled: open });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[80dvh] w-11/12 overflow-y-auto"
        onCloseAutoFocus={onCloseAutoFocus}
        onKeyDown={(event) => {
          // ダイアログ内のEnter操作を地図の地点操作へ流さない。
          if (event.key === "Enter") event.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle>下書きから再開</DialogTitle>
        </DialogHeader>
        <section aria-label="作成途中のルート" className="mb-6 space-y-3">
          <h2 className="font-semibold">作成途中のルートの続きから</h2>
          {isLoading ? (
            <p role="status" className="text-sm text-muted-foreground">
              下書きを読み込み中...
            </p>
          ) : error ? (
            <p role="alert" className="text-sm text-destructive">
              下書きを取得できませんでした。時間をおいて再度お試しください。
            </p>
          ) : drafts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              作成途中のルートはありません。地図から新しく作成できます。
            </p>
          ) : (
            <ul className="space-y-2">
              {drafts.map((draft) => (
                <li key={draft.id}>
                  <GuardedLink
                    href={`/routes/${draft.id}/details`}
                    className="block break-words underline"
                  >
                    {draft.title}
                  </GuardedLink>
                </li>
              ))}
            </ul>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
