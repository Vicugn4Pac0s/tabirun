import { Spinner } from "~/frontend/components/ui/spinner";

/** 親領域を覆うローディング表示を重ねる。親に位置指定が必要で、背面への操作は遮らない。 */
function LoadingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/40">
      <Spinner className="size-6 text-gray-500" />
    </div>
  );
}

export default LoadingOverlay;
