import { useCreateRoute } from "../hooks/useCreateRoute";
import { useState } from "react";
import { RouteCreateInput, routeCreateSchema } from "~/shared/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "~/frontend/components/ui/dialog"
import { Button } from "~/frontend/components/ui/button";
import { Input } from "~/frontend/components/ui/input";

interface CreateRouteDialogProps {
  routePoints: google.maps.LatLngLiteral[];
  kilometers: number;
}

function CreateRouteDialog({ routePoints, kilometers }: CreateRouteDialogProps) {
  const { createRoute, isCreating } = useCreateRoute();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<RouteCreateInput>({
    resolver: zodResolver(routeCreateSchema),
    defaultValues: {
      title: "",
      points: routePoints,
      kilometers
    }
  });

  const submitRoute = async (data: RouteCreateInput) => {
    await createRoute({ ...data, points: routePoints, kilometers }, {
      onSuccess: () => {
        reset();
        setOpen(false);
      },
      onError: () => {
        toast.error("ルートの保存に失敗しました");
      },
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
          <form className="flex flex-col items-center" onSubmit={handleSubmit(submitRoute)}>
            <Input
              type="text"
              placeholder="ルートの名前を入力してください"
              {...register("title")}
              disabled={isCreating}
              className="mb-4 w-full max-w-64"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mb-1">
                {errors.title.message}
              </p>
            )}
            
            <Button className="max-w-64" type="submit" disabled={isCreating}>
              {isCreating ? "保存中..." : "ルートを保存する"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CreateRouteDialog
