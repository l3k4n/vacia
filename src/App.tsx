import React from "react";
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

interface AppState {
  width: number;
  height: number;
  activeTool: DESIGN_TOOLS;
}
class App extends React.Component<Record<string, never>, AppState> {
  canvas: HTMLCanvasElement | null = null;

  constructor(props: Record<string, never>) {
    super(props);
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      activeTool: DESIGN_TOOLS.HAND,
    };
  }

  private setCanvasRef = (canvas: HTMLCanvasElement) => {
    if (canvas) {
      this.canvas = canvas;
    }
  };

  // rendering
  renderToolBar() {
    const DesignToolItem = (
      props: React.PropsWithChildren<{
        label: DESIGN_TOOLS;
        onChange?: () => void;
      }>,
    ) => (
      <ToolButton
        type="radio"
        name="selected-tool"
        label={`${props.label} tool`}
        checked={props.label === this.state.activeTool}
        children={props.children}
        onChange={() => {
          props.onChange?.();
          this.setState({ activeTool: props.label });
        }}
      />
    );
    return (
      <ToolBar options={{ position: TOOLBAR_POSITIONS.LEFT }}>
        <DesignToolItem label={DESIGN_TOOLS.HAND} children={<HandIcon />} />
        <ToolBarDivider />
        <DesignToolItem label={DESIGN_TOOLS.SELECT} children={<SelectIcon />} />
        <DesignToolItem label={DESIGN_TOOLS.RECT} children={<RectIcon />} />
        <DesignToolItem
          label={DESIGN_TOOLS.ELLIPSE}
          children={<EllipseIcon />}
        />
        <DesignToolItem label={DESIGN_TOOLS.PEN} children={<PenIcon />} />
      </ToolBar>
    );
  }

  // eslint-disable-next-line class-methods-use-this
  renderUtilityBar() {
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
    );
  }

  render() {
    const canvasWidth = this.state.width;
    const canvasHeight = this.state.height;
    const canvasVirtualWidth = canvasWidth * window.devicePixelRatio;
    const canvasVirtualHeight = canvasHeight * window.devicePixelRatio;

    return (
      <div className="app">
        <div className="tools">
          {this.renderToolBar()}
          {this.renderUtilityBar()}
        </div>
        <canvas
          width={canvasVirtualWidth}
          height={canvasVirtualHeight}
          style={{ width: canvasWidth, height: canvasHeight }}
          ref={this.setCanvasRef}
        />
      </div>
    );
  }
}
export default App;
