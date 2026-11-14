"use client";

import { GuardedLink } from "~/frontend/providers/GuardedLink";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/frontend/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/frontend/components/ui/dropdown-menu";

type Props = {
  image?: string | null;
  name?: string | null;
  onLogout: () => void;
};

/**
 * プロフィールへのリンクとログアウト操作を持つメニューを表示する。
 * ログアウト処理は呼出側に任せ、プロフィールへの遷移には離脱確認を適用する。
 */
export const UserMenuView = ({ image, name, onLogout }: Props) => {
  const fallbackLabel = name?.slice(0, 1).toUpperCase() ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="ユーザーメニュー"
          className="w-11 overflow-hidden rounded-full"
        >
          <Avatar className="h-11 w-11">
            <AvatarImage src={image ?? undefined} alt={name ?? "User"} />
            <AvatarFallback>{fallbackLabel}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <GuardedLink href="/settings/profile">Profile</GuardedLink>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onLogout}>Logout</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
