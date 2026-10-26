import { Spinner } from "~/frontend/components/ui/spinner";

function LoadingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/40">
      <Spinner className="size-6 text-gray-500" />
    </div>
  );
}

export default LoadingOverlay;
