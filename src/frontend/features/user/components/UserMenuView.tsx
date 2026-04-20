"use client";

import { useState } from "react";

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
import { UserProfileDialog } from "~/frontend/features/user/components/UserProfileDialog";

type Props = {
  image?: string | null;
  name?: string | null;
  onLogout: () => void;
};

export const UserMenuView = ({ image, name, onLogout }: Props) => {
  const [open, setOpen] = useState(false);
  const fallbackLabel = name?.slice(0, 1).toUpperCase() ?? "U";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-11 overflow-hidden rounded-full">
            <Avatar className="h-11 w-11">
              <AvatarImage src={image ?? undefined} alt={name ?? "User"} />
              <AvatarFallback>{fallbackLabel}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setOpen(true)}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout}>Logout</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserProfileDialog open={open} onOpenChange={setOpen} />
    </>
  );
};
