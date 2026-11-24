import { GuardedLink } from "~/frontend/providers/GuardedLink";
import { useRouteDraftsQuery } from "../api/useRouteDraftsQuery";

/** 作成途中のルートを詳細入力から再開する入口を表示する。取得失敗でも新規作成は妨げない。 */
export function RouteDraftList() {
  const { drafts, isLoading, error } = useRouteDraftsQuery();
  return (
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
  );
}
