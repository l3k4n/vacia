import { FullScreenIcon, ZoomInIcon, ZoomOutIcon } from "@assets/icons";
import ToolButton from "@components/ToolButton";
import "./style.scss";

interface QuickActionsProps {
  onZoomIn(): void;
  onZoomOut(): void;
}

export default function QuickActions(props: QuickActionsProps) {
  return (
    <div className="QuickActionsIsland">
      <ToolButton
        type="button"
        children={<ZoomOutIcon />}
        label={"zoom out"}
        onClick={props.onZoomOut}
        testId="quickaction-zoom-out"
      />
      <ToolButton
        type="button"
        children={<ZoomInIcon />}
        label={"zoom in"}
        onClick={props.onZoomIn}
        testId="quickaction-zoom-in"
      />
      <ToolButton
        type="button"
        children={<FullScreenIcon />}
        label={"fullscreen"}
        testId="quickaction-fullscreen"
      />
    </div>
  );
}
