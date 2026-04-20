"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "~/frontend/components/ui/button";
import { UserMenuView } from "~/frontend/features/user/components/UserMenuView";

export const AuthUserMenu = () => {
  const { data: session } = useSession();

  if (!session?.user) {
    return <Button onClick={() => signIn()}>Sign In</Button>;
  }

  return (
    <UserMenuView
      image={session.user.image}
      name={session.user.name}
      onLogout={() => signOut()}
    />
  );
};
