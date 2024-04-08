import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { DrawingTools, ControlTools, ToolLabel } from "@core/tools";
import "./style.scss";

interface ToolBarProps {
  activeTool: ToolLabel;
  onToolChange: (tool: ToolLabel) => void;
}

export default function ToolBar(props: ToolBarProps) {
  const { hand, select } = ControlTools;

  return (
    <ToggleGroup.Root
      className="ToolBar"
      type="single"
      aria-label="Active tool"
      value={props.activeTool}
      onValueChange={props.onToolChange}
      rovingFocus={false}>
      <ToggleGroup.Item className="ToolBarItem" value={hand.label}>
        <hand.icon />
      </ToggleGroup.Item>
      <div className="Separator" />
      <ToggleGroup.Item className="ToolBarItem" value={select.label}>
        <select.icon />
      </ToggleGroup.Item>
      {DrawingTools.map(({ icon: ToolIcon, label }, i) => (
        <ToggleGroup.Item key={i} className="ToolBarItem" value={label}>
          <ToolIcon />
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
