import React from "react";
import DesignMenu from "@components/DesignMenu";
import QuickActions from "@components/QuickActions";
import ToolBar from "@components/ToolBar";
import { ELEMENT_PRECISION, ZOOM_STEP } from "@constants";
import getDefaultAppState from "@core/defaultState";
import ElementLayer, { ElementLayerChangeEvent } from "@core/elementLayer";
import { createFreedrawElement, createShapeElement } from "@core/elements";
import {
  hitTestElementAgainstBox,
  hitTestCoordsAgainstBox,
  hitTestCoordsAgainstElement,
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
import {
  getSurroundingBoundingBox,
  invertNegativeBoundingBox,
} from "@core/utils";
import {
  getScreenCenterCoords,
  getNewZoomState,
  snapVirtualCoordsToGrid,
  screenOffsetToVirtualOffset,
} from "@core/viewport";
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
  elementLayer = new ElementLayer(this.onElementLayerUpdate.bind(this));

  constructor(props: Record<string, never>) {
    super(props);
    this.state = getDefaultAppState(window);
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

      if (hitTestCoordsAgainstElement(element, point)) {
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

  // local event handlers
  private onToolChange = (tool: ToolLabel) => {
    this.setState({ activeTool: tool });
  };

  private onElementLayerUpdate(e: ElementLayerChangeEvent) {
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

  private onElementDrag(pointer: PointerState, elements: CanvasElement[]) {
    const currentDragOffsetSnapped = snapVirtualCoordsToGrid(
      screenOffsetToVirtualOffset(pointer.drag.offset, this.state),
      this.state,
    );
    const previousDragOffsetSnapped = snapVirtualCoordsToGrid(
      screenOffsetToVirtualOffset(pointer.drag.previousOffset, this.state),
      this.state,
    );

    /** pointerDragChange may be less than snapping threshold, so for
     * snapping to work properly, snap the current and previous drag offsets
     * individually before getting their difference */
    const snappedPointerDragChange = {
      x: currentDragOffsetSnapped.x - previousDragOffsetSnapped.x,
      y: currentDragOffsetSnapped.y - previousDragOffsetSnapped.y,
    };

    /** if there are elements being dragged update their {x, y} coords  */
    for (let i = 0; i < elements.length; i += 1) {
      const element = elements[i];
      const newElementPosition = snapVirtualCoordsToGrid(
        {
          x: element.x + snappedPointerDragChange.x,
          y: element.y + snappedPointerDragChange.y,
        },
        this.state,
      );
      /** only mutate element if coords changes (to reduce rerenders). */
      if (
        newElementPosition.x !== element.x ||
        newElementPosition.y !== element.y
      ) {
        this.elementLayer.mutateElement(element, newElementPosition);
      }
    }
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
        drag: {
          offset: { x: 0, y: 0 },
          previousOffset: { x: 0, y: 0 },
          occurred: false,
        },
        hit: { element: null, withShiftKey: false, withCtrlKey: false },
      };

      /** pointer coords in virtual space */
      const virtualPointerCoords = screenOffsetToVirtualOffset(
        e.nativeEvent,
        this.state,
      );
      // bounding box of the element to be created
      const elementBox = {
        w: 0,
        h: 0,
        /** convert the pointer position to its virtual poistion then snap it
         * to the grid */
        ...snapVirtualCoordsToGrid(virtualPointerCoords, this.state),
      };

      switch (this.state.activeTool) {
        case "Hand":
          // does nothing onpointerdown since pointer postion is already known
          break;

        case "Selection": {
          const element = this.getFirstElementAtPoint(elementBox);

          this.pointer.hit = {
            element,
            withShiftKey: e.shiftKey,
            withCtrlKey: e.ctrlKey,
          };

          const selectedElements = this.elementLayer.getSelectedElements();
          /** Bounding box of all selected elements */
          const selectionBox = getSurroundingBoundingBox(selectedElements);
          /** whether or not pointer clicked inside selectionBox */
          const pointIsInSelection = hitTestCoordsAgainstBox(
            screenOffsetToVirtualOffset(this.pointer.origin, this.state),
            selectionBox,
          );

          if (pointIsInSelection) {
            /** Add all selected elements to dragging elements if the pointer
             * is within the bounding box of the selected elements. */
            this.elementLayer.setDraggingElements(selectedElements);
          } else {
            // If shift key is not pressed, unselect all elements.
            if (!e.shiftKey) {
              this.elementLayer.unselectAllElements();
            }

            if (element) {
              /** If an element was hit but it is outside the selectionBox, add
               * the element to the selection. Note: If shift key was not
               * pressed, it will be the only selected element. */
              this.elementLayer.selectElements([element]);
              this.elementLayer.setDraggingElements(
                // Selection changed, so use the latest selected elements.
                this.elementLayer.getSelectedElements(),
              );
            }
          }
          break;
        }

        case "Ellipse": {
          const element = createShapeElement({
            shape: "ellipse",
            ...elementBox,
          });
          this.elementLayer.addCreatingElement(element);
          break;
        }

        case "Rectangle": {
          const element = createShapeElement({ shape: "rect", ...elementBox });
          this.elementLayer.addCreatingElement(element);
          break;
        }

        case "Freedraw": {
          const element = createFreedrawElement({
            path: [[0, 0]],
            /** not using `elementBox` because freedraw should not be snapped
             * while it is being drawn drawing */
            ...virtualPointerCoords,
            w: 0,
            h: 0,
          });
          this.elementLayer.addCreatingElement(element);
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

    /** return true if multiple elements were dragged */
    const MultiElementDragOccurred =
      !this.pointer.drag.occurred &&
      this.state.activeTool === "Selection" &&
      this.elementLayer.getSelectedElements().length > 1;

    /** if pointer does not drag when there are 2 or more selected elements
     * replace selection replace selection with clicked element or add the
     * element to selection if shiftKey was pressed */
    if (MultiElementDragOccurred) {
      if (!this.pointer.hit.withShiftKey) {
        this.elementLayer.unselectAllElements();
      }

      if (this.pointer.hit.element) {
        this.elementLayer.selectElements([this.pointer.hit.element]);
      }
    }

    /** pointer is released so clear elements being dragged */
    this.elementLayer.clearDraggingElement();
    this.pointer = null;

    const elementBeingCreated = this.elementLayer.getCreatingElement();

    /** If a new element was created, delete it if it was large enough
     * otherwise delete it */
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

    /** if pointer exists update its drag and previousDrag */
    this.pointer.drag = {
      occurred: true,
      previousOffset: this.pointer.drag.offset,
      offset: {
        x: e.clientX - this.pointer.origin.x,
        y: e.clientY - this.pointer.origin.y,
      },
    };

    /** pointer offset from its previous position */
    const pointerDragChange = {
      x: this.pointer.drag.offset.x - this.pointer.drag.previousOffset.x,
      y: this.pointer.drag.offset.y - this.pointer.drag.previousOffset.y,
    };

    if (this.state.activeTool === "Hand") {
      this.setState({
        scrollOffset: {
          x: this.state.scrollOffset.x + pointerDragChange.x,
          y: this.state.scrollOffset.y + pointerDragChange.y,
        },
      });
      return;
    }

    if (this.state.activeTool === "Selection") {
      const draggingElements = this.elementLayer.getDraggingElements();

      if (draggingElements.length) {
        this.onElementDrag(this.pointer, draggingElements);
      } else {
        /** if there are no elements being dragged, pointer drag is handled as a
         * highlighted selectionBox and all elements within it are selected */
        const { box: selectionBox } = invertNegativeBoundingBox({
          ...screenOffsetToVirtualOffset(this.pointer.origin, this.state),
          w: this.pointer.drag.offset.x / this.state.zoom,
          h: this.pointer.drag.offset.y / this.state.zoom,
        });

        this.setState({ selectionHighlight: selectionBox });
        this.elementLayer.selectElements(
          this.getAllElementsWithinBox(selectionBox),
        );
      }
    }

    // Note: there will never be an element being created when using hand or
    // selection tool, so handle them outside switch statement
    const elementBeingCreated = this.elementLayer.getCreatingElement();

    if (elementBeingCreated) {
      switch (elementBeingCreated.type) {
        case "shape": {
          /** size offsets of the element snapped to the grid */
          const snappedElementSizeOffset = snapVirtualCoordsToGrid(
            {
              x: this.pointer.drag.offset.x / this.state.zoom,
              y: this.pointer.drag.offset.y / this.state.zoom,
            },
            this.state,
          );

          /** position of the element snapped to the grid */
          const snappedElementPosition = snapVirtualCoordsToGrid(
            screenOffsetToVirtualOffset(this.pointer.origin, this.state),
            this.state,
          );

          // flip x and y axis if element size is negative
          const { box, didFlipX, didFlipY } = invertNegativeBoundingBox({
            x: snappedElementPosition.x,
            y: snappedElementPosition.y,
            w: snappedElementSizeOffset.x,
            h: snappedElementSizeOffset.y,
          });

          this.elementLayer.mutateElement(elementBeingCreated, {
            x: box.x,
            y: box.y,
            // prevents element from being smaller than one grid tile
            w: Math.max(box.w, this.state.grid.size),
            h: Math.max(box.h, this.state.grid.size),
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
          const { x, y } = screenOffsetToVirtualOffset(e, this.state);

          const mutations = {
            x: elementBeingCreated.x,
            y: elementBeingCreated.y,
            w: elementBeingCreated.w,
            h: elementBeingCreated.h,
            path: [...elementBeingCreated.path],
          };

          // Change in x and y coordinates if path goes outside bounding box
          let dx = 0;
          let dy = 0;

          // adjust width and x position if point is outside bounding box
          if (elementBeingCreated.x + elementBeingCreated.w < x) {
            mutations.w = x - elementBeingCreated.x;
          } else if (elementBeingCreated.x > x) {
            mutations.w += elementBeingCreated.x - x;
            dx = mutations.x - x;
            mutations.x = x;
          }

          // adjust height and y position if point is outside bounding box
          if (elementBeingCreated.y + elementBeingCreated.h < y) {
            mutations.h = y - elementBeingCreated.y;
          } else if (elementBeingCreated.y > y) {
            mutations.h += elementBeingCreated.y - y;
            dy = mutations.y - y;
            mutations.y = y;
          }

          /** Mutating the element will not set the precision of `path`, so
           * round the point coords before adding to path */
          mutations.path.push([
            // subtract x, y coords to make point relative to element position.
            +(x - mutations.x).toFixed(ELEMENT_PRECISION),
            +(y - mutations.y).toFixed(ELEMENT_PRECISION),
          ]);

          /** if there changes to x or y coords to path if there are any */
          if (dx || dy) {
            mutations.path.forEach((point) => {
              // eslint-disable-next-line no-param-reassign
              point[0] = +(point[0] + dx).toFixed(2);
              // eslint-disable-next-line no-param-reassign
              point[1] = +(point[1] + dy).toFixed(2);
            });
          }
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
            onToolChange={this.onToolChange}
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
