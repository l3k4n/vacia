import { Root as Toggle } from "@radix-ui/react-toggle";
import {
  Root,
  ToggleGroup,
  ToggleItem as ToggleGroupItem,
  Separator,
} from "@radix-ui/react-toolbar";
import { LockIcon } from "@assets/icons";
import { DrawingTools, ControlTools, ToolLabel } from "@core/tools";
import "./style.scss";

interface ToolBarProps {
  toolLocked: boolean;
  activeTool: ToolLabel;
  onToolChange(tool: ToolLabel): void;
  onToolLockChange(value: boolean): void;
}

const HandTool = ControlTools.hand;
const SelectTool = ControlTools.select;

export default function ToolBar(props: ToolBarProps) {
  const onToolChange = (tool: ToolLabel | "") => {
    if (!tool) return;
    props.onToolChange(tool);
  };

  return (
    <Root className="ToolBar">
      <div className="ToolBarGroup">
        <Toggle
          aria-label={"Lock current tool"}
          className="ToolBarItem"
          pressed={props.toolLocked}
          onPressedChange={props.onToolLockChange}>
          <LockIcon />
        </Toggle>
      </div>
      <Separator className="Separator" />
      <ToggleGroup
        type="single"
        className="ToolBarGroup"
        value={props.activeTool}
        onValueChange={onToolChange}>
        <ToggleGroupItem className="ToolBarItem" value={HandTool.label}>
          <HandTool.icon />
        </ToggleGroupItem>
        <ToggleGroupItem className="ToolBarItem" value={SelectTool.label}>
          <SelectTool.icon />
        </ToggleGroupItem>
        {DrawingTools.map((tool, i) => (
          <ToggleGroupItem key={i} className="ToolBarItem" value={tool.label}>
            <tool.icon />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Root>
  );
}
