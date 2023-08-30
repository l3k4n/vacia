import ToolButton from "@components/ToolButton";
import { DrawingTools, ControlTools } from "@core/tools";
import { ToolLabel } from "@core/types";
import "./style.scss";

interface ToolBarProps {
  position: "top" | "left" | "right" | "bottom";
  activeTool: ToolLabel;
  onToolChange: (tool: ToolLabel) => void;
}
interface ToolItemProps {
  label: ToolLabel;
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
      <ToolItem
        label={ControlTools.hand.label}
        icon={<ControlTools.hand.icon />}
        testId={"toolitem-hand"}
      />
      <ToolBarSeparator />
      <ToolItem
        label={ControlTools.select.label}
        icon={<ControlTools.select.icon />}
        testId={"toolitem-select"}
      />
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
