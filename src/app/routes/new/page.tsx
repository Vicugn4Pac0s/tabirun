import { SessionProvider } from "next-auth/react";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { RouteCreateMap } from "~/frontend/features/route/screens/RouteCreateMap";
import { ProtectedPageFallback } from "~/app/_components/ProtectedPageFallback";
import { getProtectedPageState } from "~/server/auth/getProtectedPageState";

export default async function RouteCreatePage() {
  const state = await getProtectedPageState();
  if (state.status !== "ready") {
    return <ProtectedPageFallback state={state} />;
  }

  return (
    <SessionProvider session={state.session}>
      <main>
        <RouteCreateMap defaultCenter={GOOGLE_MAP_DEFAULT_CENTER} />
      </main>
    </SessionProvider>
  );
}
