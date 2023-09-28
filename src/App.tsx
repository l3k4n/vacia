import React from "react";
import DesignMenu from "@components/DesignMenu";
import QuickActions from "@components/QuickActions";
import ToolBar from "@components/ToolBar";
import { ZOOM_STEP } from "@constants";
import ElementLayer, { ElementLayerChangeEvent } from "@core/elementLayer";
import { createFreedrawElement, createShapeElement } from "@core/elements";
import {
  hitTestElementAgainstBox,
  hitTestPointAgainstBox,
} from "@core/hitTest";
import renderFrame from "@core/renderer";
import {
  AppState,
  CanvasElement,
  PointerState,
  BoundingBox,
  ToolLabel,
  XYCoords,
  CanvasElementMutations,
} from "@core/types";
import { getScreenCenterCoords, invertNegativeBoundingBox } from "@core/utils";
import { getNewZoomState } from "@core/viewport/zoom";
import "@css/App.scss";

declare global {
  interface Window {
    appData: {
      state: AppState;
      setState: (state: Partial<AppState>) => void;
      pointer: PointerState | null;
    };
  }
}

class App extends React.Component<Record<string, never>, AppState> {
  canvas: HTMLCanvasElement | null = null;
  pointer: PointerState | null = null;
  elementLayer = new ElementLayer(this.onElementLayerChange.bind(this));

  constructor(props: Record<string, never>) {
    super(props);
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      activeTool: "Hand",
      grid: { type: "line", size: 20 },
      scrollOffset: { x: 0, y: 0 },
      zoom: 1,
      toolbarPosition: "left",
      selectionHighlight: null,
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

  private getFirstElementAtPoint(point: XYCoords) {
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

  private getAllElementsWithinBox(box: BoundingBox) {
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

  /** checks if element should be discarded (i.e too small, etc)  */
  private isElementNegligible(element: CanvasElement) {
    switch (element.type) {
      case "freedraw":
        return element.path.length < 2;

      case "shape":
        // shape is smaller than one grid pixel
        return (
          element.w < this.state.grid.size && element.h < this.state.grid.size
        );

      default:
        return false;
    }
  }

  // setup functions
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

  private onElementLayerChange(e: ElementLayerChangeEvent) {
    this.setState({});
  }

  private onDesignMenuUpdate = (
    elements: CanvasElement[],
    mutations: CanvasElementMutations,
  ) => {
    for (let i = 0; i < elements.length; i += 1) {
      const element = elements[i];
      this.elementLayer.mutateElement(element, mutations);
    }
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

      // bounding box of the element to be created
      const elementBox = {
        w: 0,
        h: 0,
        ...this.screenOffsetToVirtualOffset({ x: e.clientX, y: e.clientY }),
      };

      switch (this.state.activeTool) {
        case "Hand":
          // does nothing onpointerdown since pointer postion is already known
          break;

        case "Selection": {
          const element = this.getFirstElementAtPoint(elementBox);

          // if shift key is'nt down when pointerdown occurs,
          // replace selection with clicked element otherwise append element
          if (!e.shiftKey) this.elementLayer.unSelectAllElements();
          if (element) this.elementLayer.selectElements([element]);

          break;
        }

        case "Ellipse": {
          const element = createShapeElement({
            shape: "ellipse",
            ...elementBox,
          });
          this.elementLayer.addElementBeingCreated(element);
          break;
        }

        case "Rectangle": {
          const element = createShapeElement({ shape: "rect", ...elementBox });
          this.elementLayer.addElementBeingCreated(element);
          break;
        }

        case "Freedraw": {
          const element = createFreedrawElement({ path: [], ...elementBox });
          this.elementLayer.addElementBeingCreated(element);
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

  private onWindowPointerUp = (e: PointerEvent) => {
    if (!this.pointer) return;
    this.pointer = null;

    const elementBeingCreated = this.elementLayer.getElementBeingCreated();

    if (elementBeingCreated && this.isElementNegligible(elementBeingCreated)) {
      this.elementLayer.deleteElement(elementBeingCreated);
    } else {
      this.elementLayer.finishCreatingElement();
    }

    if (this.state.activeTool === "Selection") {
      this.setState({ selectionHighlight: null });
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
      const { box: selectionBox } = invertNegativeBoundingBox({
        ...this.screenOffsetToVirtualOffset(this.pointer.origin),
        w: this.pointer.dragOffset.x / this.state.zoom,
        h: this.pointer.dragOffset.y / this.state.zoom,
      });

      this.setState({ selectionHighlight: selectionBox });
      this.elementLayer.selectElements(
        this.getAllElementsWithinBox(selectionBox),
      );
      return;
    }

    // Note: there will never be an element being created when using hand or
    // selection tool, so handle them outside switch statement below
    const elementBeingCreated = this.elementLayer.getElementBeingCreated();

    if (elementBeingCreated) {
      switch (elementBeingCreated.type) {
        case "shape": {
          // flip x and y axis if element size is negative
          const { box, didFlipX, didFlipY } = invertNegativeBoundingBox({
            ...this.screenOffsetToVirtualOffset(this.pointer.origin),
            // make the size relative to current zoom
            w: this.pointer.dragOffset.x / this.state.zoom,
            h: this.pointer.dragOffset.y / this.state.zoom,
          });

          this.elementLayer.mutateElement(elementBeingCreated, {
            ...box,
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

          const mutations = {
            x: elementBeingCreated.x,
            y: elementBeingCreated.y,
            w: elementBeingCreated.w,
            h: elementBeingCreated.h,
            path: [...elementBeingCreated.path],
          };

          // adjust width and x position if point is outside bounding box
          if (elementBeingCreated.x + elementBeingCreated.w < x) {
            mutations.w = x - elementBeingCreated.x;
          } else if (elementBeingCreated.x > x) {
            mutations.w += elementBeingCreated.x - x;
            mutations.x = x;
          }

          // adjust height and y position if point is outside bounding box
          if (elementBeingCreated.y + elementBeingCreated.h < y) {
            mutations.h = y - elementBeingCreated.y;
          } else if (elementBeingCreated.y > y) {
            mutations.h += elementBeingCreated.y - y;
            mutations.y = y;
          }

          mutations.path.push([x, y]);

          // apply mutations
          this.elementLayer.mutateElement(elementBeingCreated, mutations);
          break;
        }

        default:
          break;
      }
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
      selectedElements: this.elementLayer.getSelectedElements(),
    });
  }

  componentDidUpdate() {
    renderFrame({
      canvas: this.canvas!,
      state: this.state,
      scale: window.devicePixelRatio,
      elements: this.elementLayer.getAllElements(),
      selectedElements: this.elementLayer.getSelectedElements(),
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
          anchor: getScreenCenterCoords(this.state),
        },
        this.state,
      );

      this.setState(zoomState);
    };
    const handleZoomOutAction = () => {
      const zoomState = getNewZoomState(
        {
          value: this.state.zoom - ZOOM_STEP,
          anchor: getScreenCenterCoords(this.state),
        },
        this.state,
      );

      this.setState(zoomState);
    };

    const selectedElements = this.elementLayer.getSelectedElements();

    return (
      <div className="app">
        {!!selectedElements.length && (
          <DesignMenu
            selectedElements={selectedElements}
            toolbarPosition={this.state.toolbarPosition}
            onChange={this.onDesignMenuUpdate}
          />
        )}
        <div className="tools">
          <ToolBar
            position={this.state.toolbarPosition}
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
