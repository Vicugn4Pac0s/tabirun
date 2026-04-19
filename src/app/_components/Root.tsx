import Sidebar from "~/frontend/components/layout/Sidebar";
import MapScreen from "./MapScreen";

function Root() {
  return (
    <div className="flex">
      <div className="w-72">
        <Sidebar>
          <></>
        </Sidebar>
      </div>
      <MapScreen />
    </div>
  );
}

export default Root;
