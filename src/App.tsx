import React, { useState } from "react";
import {
  EllipseIcon,
  FullScreenIcon,
  HandIcon,
  PenIcon,
  RectIcon,
  SelectIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@assets/icons";
import ToolBar, { UtilityBar, ToolBarDivider } from "@components/ToolBar";
import ToolButton from "@components/ToolButton";
import { TOOLBAR_POSITIONS, DESIGN_TOOLS, UTILITY_TOOLS } from "@constants";
import "@css/App.scss";
// TODO: create Draggable ToolMenu component

function App() {
  const [activeDesignTool, setActiveDesignTool] = useState<DESIGN_TOOLS>(
    DESIGN_TOOLS.HAND,
  );
  const DesignToolItem = (
    props: React.PropsWithChildren<{
      label: DESIGN_TOOLS;
      onChange?: () => void;
    }>,
  ) => (
    <ToolButton
      {...props}
      type="radio"
      name="selected-tool"
      label={`${props.label} tool`}
      checked={props.label === activeDesignTool}
      onChange={() => {
        setActiveDesignTool(props.label);
        props.onChange?.();
      }}
    />
  );
  const ButtonToolItem = (
    props: React.PropsWithChildren<{
      label: UTILITY_TOOLS;
      onClick?: () => void;
    }>,
  ) => (
    <ToolButton
      {...props}
      type="button"
      label={props.label}
      onClick={() => {
        props.onClick?.();
      }}
    />
  );
  return (
    <div className="app">
      <div className="tools">
        <ToolBar options={{ position: TOOLBAR_POSITIONS.LEFT }}>
          <DesignToolItem label={DESIGN_TOOLS.HAND} children={<HandIcon />} />
          <ToolBarDivider />
          <DesignToolItem
            label={DESIGN_TOOLS.SELECT}
            children={<SelectIcon />}
          />
          <DesignToolItem label={DESIGN_TOOLS.RECT} children={<RectIcon />} />
          <DesignToolItem
            label={DESIGN_TOOLS.ELLIPSE}
            children={<EllipseIcon />}
          />
          <DesignToolItem label={DESIGN_TOOLS.PEN} children={<PenIcon />} />
        </ToolBar>
        <UtilityBar>
          <ButtonToolItem
            children={<ZoomOutIcon />}
            label={UTILITY_TOOLS.ZOOM_OUT}
          />
          <ButtonToolItem
            children={<ZoomInIcon />}
            label={UTILITY_TOOLS.ZOOM_IN}
          />
          <ToolBarDivider />
          <ButtonToolItem
            children={<FullScreenIcon />}
            label={UTILITY_TOOLS.FULLSCREEN}
          />
        </UtilityBar>
      </div>
    </div>
  );
}

export default App;
