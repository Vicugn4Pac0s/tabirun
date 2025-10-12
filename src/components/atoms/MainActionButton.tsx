import { MapPinPlus, MapPinX, Play } from "lucide-react";

type Props = {
  type: "add" | "delete" | "play";
  className?: string;
  onClick?: () => void;
}

const MainActionButton = ({ type, className, onClick }: Props) => {
  let Icon;

  switch (type) {
    case "add":
      Icon = MapPinPlus;
      break;
    case "delete":
      Icon = MapPinX;
      break;
    case "play":
      Icon = Play;
      break;
  }
  return (
    <button className={`bg-primary border-white text-white rounded-full flex justify-center items-center h-20 w-20 ${className}`} onClick={onClick}>
      <Icon className="h-12 w-12" />
    </button>
  );
}
export default MainActionButton;