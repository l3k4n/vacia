import React from "react";
import QuickActions from "@components/QuickActions";
import ToolBar from "@components/ToolBar";
import { ZOOM_STEP } from "@constants";
import { createFreedrawElement, createShapeElement } from "@core/elements";
import ElementLayer from "@core/elements/layer";
import {
  hitTestElementAgainstBox,
  hitTestPointAgainstBox,
} from "@core/hitTest";
import renderFrame from "@core/renderer";
import SelectionManager from "@core/selection";
import {
  AppState,
  CanvasElement,
  CanvasPointer,
  Dimensions,
  ToolLabel,
  XYCoords,
} from "@core/types";
import { getVisibleCenterCoords, invertNegativeDimensions } from "@core/utils";
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
  selection = new SelectionManager(this.onCanvasSelectionChange.bind(this), {
    getAllElements: this.elementLayer.getAllElements,
    getAllElementsInBox: this.selectElementsWithinBox.bind(this),
    getFirstElementAtPoint: this.selectElementsAtPoint.bind(this),
  });

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

  private selectElementsAtPoint(point: XYCoords) {
    const allElements = this.elementLayer.getAllElements();
    let hitElement: CanvasElement | null = null;

    for (let i = allElements.length - 1; i > -1; i -= 1) {
      const element = allElements[i];

      if (hitTestPointAgainstBox(element, point)) {
        hitElement = element;
        break;
      }
    }
    return hitElement;
  }

  private selectElementsWithinBox(box: Dimensions) {
    const allElements = this.elementLayer.getAllElements();
    const hitElements: CanvasElement[] = [];

    for (let i = 0; i < allElements.length; i += 1) {
      const element = allElements[i];

      if (hitTestElementAgainstBox(element, box)) {
        hitElements.push(element);
      }
    }

    return hitElements;
  }

  private setCanvasRef = (canvas: HTMLCanvasElement) => {
    if (canvas) {
      this.canvas = canvas;
    }
  };

  /** Converts a screen position to its corresponding position relative to the
   * scroll offset. */
  private screenOffsetToVirtualOffset(position: XYCoords) {
    return {
      x: (position.x - this.state.scrollOffset.x) / this.state.zoom,
      y: (position.y - this.state.scrollOffset.y) / this.state.zoom,
    };
  }

  // custom events
  private handleToolChange = (tool: ToolLabel) => {
    this.setState({ activeTool: tool });
  };

  private onCanvasSelectionChange() {
    this.setState({});
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

        case "Selection": {
          // if shift key is'nt down when pointerdown occurs,
          // empty selection before adding new element
          if (!e.shiftKey) {
            this.selection.clearSelectedElements();
          }
          const elementWasFound = this.selection.addElementAtPoint(
            e.nativeEvent,
          );
          // checks shiftKey to allow drag select, from a point with no elements
          if (!elementWasFound && !e.shiftKey) {
            this.selection.clearSelectedElements();
          }
          break;
        }

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
      this.selection.clearBoxHighlight();
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

    if (this.state.activeTool === "Selection") {
      const { dimensions: selectionBox } = invertNegativeDimensions({
        ...this.screenOffsetToVirtualOffset(this.pointer.origin),
        w: this.pointer.dragOffset.x / this.state.zoom,
        h: this.pointer.dragOffset.y / this.state.zoom,
      });

      this.selection.setBoxHighlight(selectionBox);
      this.selection.addElementsWithinBox(selectionBox);
      return;
    }

    // Note: there will never be an element being created when using hand or
    // selection tool, so handle them outside switch statement below
    const elementBeingCreated = this.elementLayer.getElementBeingCreated();

    if (elementBeingCreated) {
      switch (elementBeingCreated.type) {
        case "shape": {
          // flip x and y axis if element size is negative
          const { dimensions, didFlipX, didFlipY } = invertNegativeDimensions({
            ...this.screenOffsetToVirtualOffset(this.pointer.origin),
            // make the size relative to current zoom
            w: this.pointer.dragOffset.x / this.state.zoom,
            h: this.pointer.dragOffset.y / this.state.zoom,
          });

          Object.assign(elementBeingCreated, {
            ...dimensions,
            transforms: {
              ...elementBeingCreated.transforms,
              // set axes that flipped
              flippedX: didFlipX,
              flippedY: didFlipY,
            },
          });
          break;
        }

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
      selection: this.selection.getSelectionData(),
    });
  }

  componentDidUpdate() {
    renderFrame({
      canvas: this.canvas!,
      state: this.state,
      scale: window.devicePixelRatio,
      elements: this.elementLayer.getAllElements(),
      selection: this.selection.getSelectionData(),
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
