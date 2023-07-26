import { FullScreenIcon, ZoomInIcon, ZoomOutIcon } from "@assets/icons";
import ToolButton from "@components/ToolButton";
import "./style.scss";

export default function QuickActions() {
  return (
    <div className="QuickActionsIsland" style={{ right: 10, bottom: 10 }}>
      <ToolButton type="button" children={<ZoomOutIcon />} label={"zoom out"} />
      <ToolButton type="button" children={<ZoomInIcon />} label={"zoom in"} />
      <ToolButton
        type="button"
        children={<FullScreenIcon />}
        label={"fullscreen"}
      />
    </div>
  );
}
