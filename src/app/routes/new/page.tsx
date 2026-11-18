import { SessionProvider } from "next-auth/react";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { RouteCreateScreen } from "~/frontend/features/route/components/RouteCreateScreen";
import { renderProtectedPage } from "~/app/_lib/renderProtectedPage";
import { getProtectedPageState } from "~/server/auth/getProtectedPageState";

export default async function RouteCreatePage() {
  return renderProtectedPage(await getProtectedPageState(), ({ session }) => (
    <SessionProvider session={session}>
      <main>
        <RouteCreateScreen defaultCenter={GOOGLE_MAP_DEFAULT_CENTER} />
      </main>
    </SessionProvider>
  ));
}
