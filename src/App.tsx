import React from "react";
import QuickActions from "@components/QuickActions";
import ToolBar from "@components/ToolBar";
import { ZOOM_STEP } from "@constants";
import renderFrame from "@core/renderer";
import {
  AppState,
  CanvasPointer,
  DrawingToolLabel,
  XYCoords,
} from "@core/types";
import { getVisibleCenterCoords } from "@core/utils";
import "@css/App.scss";

declare global {
  interface Window {
    appData: {
      state: AppState;
      setState: (state: Partial<AppState>) => void;
      pointer: CanvasPointer | null;
    };
  }
}

class App extends React.Component<Record<string, never>, AppState> {
  canvas: HTMLCanvasElement | null = null;
  pointer: CanvasPointer | null = null;

  constructor(props: Record<string, never>) {
    super(props);
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      activeTool: "Hand",
      grid: { type: "line", size: 20 },
      scrollOffset: { x: 0, y: 0 },
      zoom: 1,
    };
    if (import.meta.env.DEV) {
      window.appData = {} as Window["appData"];
      Object.defineProperties(window.appData, {
        state: {
          configurable: true,
          get: () => this.state,
        },
        setState: {
          configurable: true,
          value: (...args: Parameters<typeof this.setState>) => {
            this.setState(...args);
          },
        },
        pointer: {
          configurable: true,
          get: () => this.pointer,
        },
      });
    }
  }

  private setCanvasRef = (canvas: HTMLCanvasElement) => {
    if (canvas) {
      this.canvas = canvas;
    }
  };

  private handleToolChange = (tool: DrawingToolLabel) => {
    this.setState({ activeTool: tool });
  };

  /** Handles zooming around an anchor point.
   * Anchor point will visibly remain in same position after zooming. */
  private zoomToCoords = (newZoom: number, point: XYCoords) => {
    const currentZoom = this.state.zoom;
    const zoomMulitplier = newZoom / currentZoom;

    const scrollOffsetFromPointX = point.x - this.state.scrollOffset.x;
    const scrollOffsetFromPointY = point.y - this.state.scrollOffset.y;

    this.setState({
      zoom: newZoom,
      scrollOffset: {
        x: point.x - scrollOffsetFromPointX * zoomMulitplier,
        y: point.y - scrollOffsetFromPointY * zoomMulitplier,
      },
    });
  };

  // event handling
  private addEventListeners = () => {
    window.addEventListener("pointermove", this.onWindowPointerMove);
    window.addEventListener("pointerup", this.onWindowPointerUp);
    window.addEventListener("wheel", this.onWindowWheel, { passive: false });
  };

  private onCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.buttons === 1) {
      this.pointer = {
        origin: { x: e.clientX, y: e.clientY },
        dragOffset: { x: 0, y: 0 },
        initialScrollOffset: { ...this.state.scrollOffset },
      };
    }
  };

  private onWindowWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.metaKey || e.ctrlKey) {
      const direction = -Math.sign(e.deltaY);
      const zoomAmount = this.state.zoom + direction * ZOOM_STEP;

      this.zoomToCoords(zoomAmount, { x: e.clientX, y: e.clientY });
    }
  };

  private onWindowPointerUp = () => {
    this.pointer = null;
  };

  private onWindowPointerMove = (e: PointerEvent) => {
    if (this.pointer) {
      this.pointer.dragOffset = {
        x: e.clientX - this.pointer.origin.x,
        y: e.clientY - this.pointer.origin.y,
      };
      this.setState({
        scrollOffset: {
          x: this.pointer.initialScrollOffset.x + this.pointer.dragOffset.x,
          y: this.pointer.initialScrollOffset.y + this.pointer.dragOffset.y,
        },
      });
    }
  };

  // react lifecycle
  componentDidMount() {
    this.addEventListeners();
    renderFrame({
      canvas: this.canvas!,
      state: this.state,
      scale: window.devicePixelRatio,
    });
  }

  componentDidUpdate() {
    renderFrame({
      canvas: this.canvas!,
      state: this.state,
      scale: window.devicePixelRatio,
    });
  }

  // rendering
  render() {
    const canvasWidth = this.state.width;
    const canvasHeight = this.state.height;
    const canvasVirtualWidth = canvasWidth * window.devicePixelRatio;
    const canvasVirtualHeight = canvasHeight * window.devicePixelRatio;

    const zoomFromCenter = (direction: "in" | "out") => {
      const directionValue = direction === "in" ? 1 : -1;
      const zoomAmount = this.state.zoom + directionValue * ZOOM_STEP;

      this.zoomToCoords(zoomAmount, getVisibleCenterCoords(this.state));
    };

    return (
      <div className="app">
        <div className="tools">
          <ToolBar
            position={"left"}
            activeTool={this.state.activeTool}
            onToolChange={this.handleToolChange}
          />
          <QuickActions
            onZoomIn={() => zoomFromCenter("in")}
            onZoomOut={() => zoomFromCenter("out")}
          />
        </div>
        <canvas
          data-testid="app-canvas"
          width={canvasVirtualWidth}
          height={canvasVirtualHeight}
          style={{ width: canvasWidth, height: canvasHeight }}
          ref={this.setCanvasRef}
          onPointerDown={this.onCanvasPointerDown}
        />
      </div>
    );
  }
}
export default App;
