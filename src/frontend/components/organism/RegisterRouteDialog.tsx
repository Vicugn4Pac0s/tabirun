import { useCreateRoute } from "~/frontend/hooks/routes/useCreateRoute";
import { useState } from "react";
import { routeCreateSchema } from "~/shared/schemas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "~/frontend/components/ui/dialog"
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface RegisterRouteDialogProps {
  routePoints: google.maps.LatLngLiteral[];
  kilometers: number;
}

function RegisterRouteDialog({ routePoints, kilometers }: RegisterRouteDialogProps) {
  const { createRoute, isCreating } = useCreateRoute();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const submitRoute = async () => {
    const parsedData = routeCreateSchema.parse({ title, points: routePoints, kilometers });
    await createRoute(parsedData, {
      onSuccess: () => {
        setTitle("");
        setOpen(false);
      }
    });
  };
  
  return (
    <>
      <Button onClick={()=>{setOpen(true)}}>このルートを登録する</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">ルート登録</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center">
            <Input
              type="text"
              placeholder="ルートの名前を入力してください"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mb-4 w-full max-w-64"
            />
            <Button className="max-w-64" onClick={submitRoute} disabled={isCreating}>
              {isCreating ? "保存中..." : "ルートを保存する"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default RegisterRouteDialog