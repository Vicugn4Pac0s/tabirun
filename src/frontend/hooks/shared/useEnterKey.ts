import { useEffect } from "react";

type UseEnterKeyOptions = {
  enabled?: boolean;
  preventDefault?: boolean;
};

const isFormControl = (target: EventTarget | null) =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement ||
  (target instanceof HTMLElement && target.isContentEditable);

/** フォーム入力中を除き、windowのEnter押下でコールバックを呼ぶ。
 * enabledがfalseなら購読せず、既定ではブラウザの既定動作を抑止する。 */
export const useEnterKey = (
  onEnter: () => void,
  options: UseEnterKeyOptions = {},
) => {
  const { enabled = true, preventDefault = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (isFormControl(e.target)) return;

      if (preventDefault) {
        e.preventDefault();
      }

      onEnter();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onEnter, enabled, preventDefault]);
};
