import { MapPinPlus, MapPinX, Play } from "lucide-react";

type Props = {
  type: "add" | "delete" | "play";
  className?: string;
  onClick?: () => void;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
}

const MainActionButton = ({ type, className, onClick, onMouseOver, onMouseOut }: Props) => {
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
    <button className={`bg-primary border-white text-white rounded-full flex justify-center items-center h-20 w-20 ${className}`} onClick={onClick} onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
      <Icon className="h-12 w-12" />
    </button>
  );
}
export default MainActionButton;