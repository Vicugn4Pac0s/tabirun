import { SessionProvider } from "next-auth/react";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { RouteCreateScreen } from "~/frontend/features/route/components/RouteCreateScreen";
import { renderProtectedPage } from "~/server/auth/renderProtectedPage";

export default async function RouteCreatePage() {
  return renderProtectedPage((session) => (
    <SessionProvider session={session}>
      <main>
        <RouteCreateScreen defaultCenter={GOOGLE_MAP_DEFAULT_CENTER} />
      </main>
    </SessionProvider>
  ));
}
