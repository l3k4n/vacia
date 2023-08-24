import { HandIcon } from "@assets/icons";
import ToolButton from "@components/ToolButton";
import DrawingTools from "@core/drawingTools";
import { DrawingToolLabel } from "@core/types";
import "./style.scss";

interface ToolBarProps {
  position: "top" | "left" | "right" | "bottom";
  activeTool: DrawingToolLabel;
  onToolChange: (tool: DrawingToolLabel) => void;
}
interface ToolItemProps {
  label: DrawingToolLabel;
  icon: React.ReactElement;
  testId: string;
}

export default function ToolBar(props: ToolBarProps) {
  const ToolBarSeparator = () => <div className="ToolBar_separator" />;
  const ToolItem = (toolProps: ToolItemProps) => (
    <ToolButton
      type="radio"
      name="selected-tool"
      label={toolProps.label}
      checked={props.activeTool === toolProps.label}
      children={toolProps.icon}
      onChange={() => props.onToolChange(toolProps.label)}
      testId={toolProps.testId}
    />
  );
  return (
    <div className={`ToolBar ToolBar_position_${props.position}`}>
      <ToolItem label={"Hand"} icon={<HandIcon />} testId={"toolitem-hand"} />
      <ToolBarSeparator />
      {DrawingTools.map(({ icon: ToolIcon, label }, i) => (
        <ToolItem
          key={i}
          label={label}
          icon={<ToolIcon />}
          testId={`toolitem-${label}`.toLowerCase()}
        />
      ))}
    </div>
  );
}
