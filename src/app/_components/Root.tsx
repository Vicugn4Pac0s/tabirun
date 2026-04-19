import Sidebar from "~/frontend/components/layout/Sidebar";
import MapScreen from "./MapScreen";
import { UserMenu } from "~/frontend/features/auth/components/UserMenu";

function Root() {
  return (
    <div className="flex">
      <div className="w-72">
        <Sidebar>
          <></>
        </Sidebar>
      </div>
      <MapScreen />
      <div className="absolute top-3 right-3 z-50">
        <UserMenu />
      </div>
    </div>
  );
}

export default Root;
