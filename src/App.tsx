import React from "react";
import QuickActions from "@components/QuickActions";
import ToolBar from "@components/ToolBar";
import { ZOOM_STEP } from "@constants";
import { createFreedrawElement, createShapeElement } from "@core/elements";
import ElementLayer from "@core/elements/layer";
import renderFrame from "@core/renderer";
import { AppState, CanvasPointer, ToolLabel, XYCoords } from "@core/types";
import { getVisibleCenterCoords } from "@core/utils";
import { getNewZoomState } from "@core/viewport/zoom";
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
  elementLayer = new ElementLayer();

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

  private handleToolChange = (tool: ToolLabel) => {
    this.setState({ activeTool: tool });
  };

  /** Converts a screen position to its corresponding position relative to the
   * scroll offset. */
  private screenOffsetToVirtualOffset(position: XYCoords) {
    return {
      x: (position.x - this.state.scrollOffset.x) / this.state.zoom,
      y: (position.y - this.state.scrollOffset.y) / this.state.zoom,
    };
  }

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
      const elementPos = this.screenOffsetToVirtualOffset({
        x: e.clientX,
        y: e.clientY,
      });
      switch (this.state.activeTool) {
        case "Hand":
          /** does nothing onpointerdown since pointer postion
           * is already known */
          break;

        case "Selection":
          // TODO handle select tool
          break;

        case "Ellipse": {
          const element = createShapeElement({
            shape: "ellipse",
            x: elementPos.x,
            y: elementPos.y,
            w: 0,
            h: 0,
          });
          this.elementLayer.addElement(element, { isBeingCreated: true });
          break;
        }

        case "Rectangle": {
          const element = createShapeElement({
            shape: "rect",
            x: elementPos.x,
            y: elementPos.y,
            w: 0,
            h: 0,
          });
          this.elementLayer.addElement(element, { isBeingCreated: true });
          break;
        }

        case "Freedraw": {
          const element = createFreedrawElement({
            path: [],
            x: elementPos.x,
            y: elementPos.y,
            w: 0,
            h: 0,
          });
          this.elementLayer.addElement(element, { isBeingCreated: true });
          break;
        }

        default:
          break;
      }
    }
  };

  private onWindowWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.metaKey || e.ctrlKey) {
      const direction = -Math.sign(e.deltaY);

      const zoomState = getNewZoomState(
        {
          value: this.state.zoom + direction * ZOOM_STEP,
          anchor: { x: e.clientX, y: e.clientY },
        },
        this.state,
      );

      this.setState(zoomState);
    }
  };

  private onWindowPointerUp = () => {
    if (this.pointer) {
      // remove pointer and completes any element being created
      this.pointer = null;
      this.elementLayer.finalizeElementCreation();
    }
  };

  private onWindowPointerMove = (e: PointerEvent) => {
    if (!this.pointer) return;
    // update pointer position regardless of active tool
    this.pointer.dragOffset = {
      x: e.clientX - this.pointer.origin.x,
      y: e.clientY - this.pointer.origin.y,
    };

    if (this.state.activeTool === "Hand") {
      this.setState({
        scrollOffset: {
          x: this.pointer.initialScrollOffset.x + this.pointer.dragOffset.x,
          y: this.pointer.initialScrollOffset.y + this.pointer.dragOffset.y,
        },
      });
      return;
    }

    if (this.state.activeTool === "Selection") return;

    const elementBeingCreated = this.elementLayer.getElementBeingCreated();

    if (elementBeingCreated) {
      switch (elementBeingCreated.type) {
        case "shape":
          elementBeingCreated.w = this.pointer.dragOffset.x / this.state.zoom;
          elementBeingCreated.h = this.pointer.dragOffset.y / this.state.zoom;
          break;

        case "freedraw": {
          const { x, y } = this.screenOffsetToVirtualOffset(e);
          elementBeingCreated.path.push([x, y]);
          break;
        }

        default:
          break;
      }

      // modifying elementBeingCreated does nothing, so trigger a rerender
      this.setState({});
    }
  };

  // react lifecycle
  componentDidMount() {
    this.addEventListeners();
    renderFrame({
      canvas: this.canvas!,
      state: this.state,
      scale: window.devicePixelRatio,
      elements: this.elementLayer.getAllElements(),
    });
  }

  componentDidUpdate() {
    renderFrame({
      canvas: this.canvas!,
      state: this.state,
      scale: window.devicePixelRatio,
      elements: this.elementLayer.getAllElements(),
    });
  }

  // rendering
  render() {
    const canvasWidth = this.state.width;
    const canvasHeight = this.state.height;
    const canvasVirtualWidth = canvasWidth * window.devicePixelRatio;
    const canvasVirtualHeight = canvasHeight * window.devicePixelRatio;

    const handleZoomInAction = () => {
      const zoomState = getNewZoomState(
        {
          value: this.state.zoom + ZOOM_STEP,
          anchor: getVisibleCenterCoords(this.state),
        },
        this.state,
      );

      this.setState(zoomState);
    };
    const handleZoomOutAction = () => {
      const zoomState = getNewZoomState(
        {
          value: this.state.zoom - ZOOM_STEP,
          anchor: getVisibleCenterCoords(this.state),
        },
        this.state,
      );

      this.setState(zoomState);
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
            onZoomIn={handleZoomInAction}
            onZoomOut={handleZoomOutAction}
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
