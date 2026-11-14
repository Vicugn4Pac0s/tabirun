import { ROUTE_POINTS_MAX } from "~/shared/schemas";

type RoutePointCountProps = { count: number };

export function RoutePointCount({ count }: RoutePointCountProps) {
  return (
    <div
      role="status"
      aria-label="ルートの地点数"
      className="rounded-md bg-background/95 px-3 py-2 text-sm text-foreground shadow"
    >
      <p>
        地点 {count} / {ROUTE_POINTS_MAX}
      </p>
      {count >= ROUTE_POINTS_MAX && (
        <p>1ルート{ROUTE_POINTS_MAX}地点までです</p>
      )}
    </div>
  );
}
