"use client";

import type { ComponentProps, ReactNode, Ref } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "~/frontend/components/ui/button";
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
        <Button
          ref={ref}
          type="button"
          variant="outline"
          size="icon"
          aria-label={ariaLabel}
          disabled={disabled}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={onCloseAutoFocus}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
