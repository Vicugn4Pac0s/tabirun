import { api } from "~/trpc/react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/frontend/components/ui/dialog"
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { set } from "zod";
import { routeCreateSchema } from "~/shared/schemas";

interface RegisterRouteDialogProps {
  routePoints: google.maps.LatLngLiteral[];
}

function RegisterRouteDialog({ routePoints }: RegisterRouteDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const utils = api.useUtils();
  const { mutate, isPending } = api.route.create.useMutation({
    onSuccess: async () => {
      await utils.route.invalidate();
      setTitle("");
      setOpen(false);
    },
  });

  const submitRoute = () => {
    try {
      const parsedData = routeCreateSchema.parse({ title, points: routePoints });
      mutate(parsedData);
    } catch (error) {
      console.error("Validation error:", error);
    }
  };
  
  return (
    <>
      <Button onClick={()=>{setOpen(true)}}>このルートを登録する</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <div className="text-center">
              <Input
                type="text"
                placeholder="ルートのタイトルを入力してください"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mb-4 w-full max-w-64"
              />
              <Button className="max-w-64" onClick={submitRoute} disabled={isPending}>
                {isPending ? "Saving..." : "Save Route"}
              </Button>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default RegisterRouteDialog