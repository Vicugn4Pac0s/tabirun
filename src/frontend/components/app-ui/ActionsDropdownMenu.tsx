"use client";

import type { ComponentProps, ReactNode, Ref } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/frontend/components/ui/dropdown-menu";

type ActionsDropdownMenuProps = {
  children: ReactNode;
  "aria-label": string;
  disabled?: boolean;
  modal?: boolean;
  ref?: Ref<HTMLButtonElement>;
  onCloseAutoFocus?: ComponentProps<
    typeof DropdownMenuContent
  >["onCloseAutoFocus"];
};

/** 「⋯」トリガーと右寄せのメニュー枠を表示する。項目はDropdownMenuItemなどで渡す。
 * refはトリガーボタンを参照し、ダイアログなどからのフォーカス復帰に使える。 */
export function ActionsDropdownMenu({
  children,
  "aria-label": ariaLabel,
  disabled,
  modal = true,
  ref,
  onCloseAutoFocus,
}: ActionsDropdownMenuProps) {
  return (
    <DropdownMenu modal={modal}>
      <DropdownMenuTrigger asChild>
        <button
          ref={ref}
          type="button"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-background text-foreground shadow-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={ariaLabel}
          disabled={disabled}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={onCloseAutoFocus}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
