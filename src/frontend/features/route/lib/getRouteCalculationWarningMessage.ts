type RouteCalculationError = {
  data?: { code?: string } | null;
};

type RouteCalculationMode = "editable" | "saved";

const messages = {
  editable: {
    quota:
      "自動ルート生成の利用上限に達しました。経由地点を直線で結んで表示しています。",
    error:
      "経路を取得できませんでした。経由地点のみ表示しています。時間をおいて再度お試しください。",
  },
  saved: {
    quota:
      "自動ルート生成の利用上限に達しました。登録地点を直線で結んで表示しています。",
    error:
      "経路を取得できませんでした。スタート・ゴールのみ表示しています。時間をおいて再度お試しください。",
  },
} as const;

export function getRouteCalculationWarningMessage(
  error: RouteCalculationError | null,
  mode: RouteCalculationMode,
): string | null {
  if (!error) return null;

  const kind = error.data?.code === "TOO_MANY_REQUESTS" ? "quota" : "error";
  return messages[mode][kind];
}
