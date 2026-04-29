import { useRouteEditorState } from "./useRouteEditorState";

const DISCARD_CONFIRM_MESSAGE =
  "未保存の変更があります。破棄して移動しますか？";

export function useRouteDiscardGuard() {
  const { mode, isDirty } = useRouteEditorState();

  const confirmDiscard = () => {
    if (typeof window === "undefined") {
      return true;
    }

    if (mode !== "edit" || !isDirty) {
      return true;
    }

    return window.confirm(DISCARD_CONFIRM_MESSAGE);
  };

  return {
    shouldConfirmDiscard: mode === "edit" && isDirty,
    confirmDiscard,
  };
}
