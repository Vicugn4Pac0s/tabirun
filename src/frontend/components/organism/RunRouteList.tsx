import { api } from "~/trpc/react";
import { Spinner } from "../ui/spinner";

function RunRouteList() {
  const { data, isLoading, error } = api.route.getByUser.useQuery();
  
  if (isLoading) {
    return <div className="flex justify-center items-center"><Spinner className="size-6" /></div>;
  }

  if (error) {
    return <p className="text-center text-red-500">エラーが発生しました: {error.message}</p>;
  }

  if(!data || data.length === 0) {
    return <p className="text-center text-base-gray">地図をクリックしてルートを作成してください</p>;
  }

  return (
    data && (
      <ul className="space-y-4">
        {data.map((route) => (
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