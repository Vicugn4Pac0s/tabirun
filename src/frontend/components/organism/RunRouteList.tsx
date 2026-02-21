import { Spinner } from "../ui/spinner";
import { useRoutesQuery } from "~/frontend/hooks/routes/useRoutesQuery";

function RunRouteList() {
  const { routes, isLoading, error } = useRoutesQuery();
  
  if (isLoading) {
    return <div className="flex justify-center items-center"><Spinner className="size-6" /></div>;
  }

  if (error) {
    return <p className="text-center text-red-500">エラーが発生しました: {error.message}</p>;
  }

  if(!routes || routes.length === 0) {
    return <p className="text-center text-base-gray">地図をクリックしてルートを作成してください</p>;
  }

  return (
    routes && (
      <ul className="space-y-4">
        {routes.map((route) => (
          <li key={route.id} className="p-4 border rounded">
            <h3 className="text-lg font-bold">{route.title}</h3>
            <p className="text-sm text-gray-500">{route.kilometers.toFixed(2)} KM</p>
          </li>
        ))}
      </ul>
    )
  );
}

export default RunRouteList