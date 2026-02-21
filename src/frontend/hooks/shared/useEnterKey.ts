import { useEffect } from "react";

type UseEnterKeyOptions = {
  enabled?: boolean;
  preventDefault?: boolean;
};

export const useEnterKey = (
  onEnter: () => void,
  options: UseEnterKeyOptions = {},
) => {
  const { enabled = true, preventDefault = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;

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