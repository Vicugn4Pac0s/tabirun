import { type TRPCClientErrorLike } from "@trpc/client";
import { type AppRouter } from "~/server/api/root";

interface DirectionsWarningBannerProps {
  error: TRPCClientErrorLike<AppRouter>;
}

function getDirectionsWarningMessage(
  error: TRPCClientErrorLike<AppRouter>,
) {
  if (error.data?.code === "TOO_MANY_REQUESTS") {
    return "本日の自動ルート生成の利用上限に達しました。直線ルートを表示しています。";
  }

  if (error.data?.code === "NOT_FOUND") {
    return "自動ルートを生成できませんでした。経由点を見直してください。直線ルートを表示しています。";
  }

  return "自動ルート生成に失敗しました。直線ルートを表示しています。";
}

function DirectionsWarningBanner({
  error,
}: DirectionsWarningBannerProps) {
  return (
    <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      {getDirectionsWarningMessage(error)}
    </div>
  );
}

export default DirectionsWarningBanner;
