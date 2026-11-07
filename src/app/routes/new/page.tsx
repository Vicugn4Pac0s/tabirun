import { SessionProvider } from "next-auth/react";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { RouteCreateScreen } from "~/frontend/features/route/components/RouteCreateScreen";
import {
  requireUserSession,
  redirectIfProfileIncomplete,
} from "~/server/auth/guards";
import { getUserHomePageSettings } from "~/server/features/user/queries";

export default async function RouteCreatePage() {
  const returnTo = "/routes/new";
  const session = await requireUserSession(returnTo);
  const user = await getUserHomePageSettings(session.user.id);
  redirectIfProfileIncomplete(user, returnTo);
  return (
    <SessionProvider session={session}>
      <main>
        <RouteCreateScreen defaultCenter={GOOGLE_MAP_DEFAULT_CENTER} />
      </main>
    </SessionProvider>
  );
}
