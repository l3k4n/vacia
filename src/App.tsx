import React from "react";
import ContextMenu, { ContextMenuItem } from "@components/ContextMenu";
import DesignMenu from "@components/DesignMenu";
import QuickActions, { QuickActionType } from "@components/QuickActions";
import ToolBar from "@components/ToolBar";
import { USERMODE, ZOOM_STEP, ROTATION_SNAP_THRESHOLD } from "@constants";
import { ActionManager } from "@core/actionManager";
import { CoreActions } from "@core/actionManager/coreActions";
import { CoreBindings } from "@core/actionManager/coreBindings";
import * as DefaultObjects from "@core/defaultObjects";
import ElementLayer from "@core/elementLayer";
import {
  EllipseHandler,
  FreedrawHandler,
  RectHandler,
  TextHandler,
} from "@core/elements";
import { ElementHandler } from "@core/elements/handler";
import {
  getResizeScale,
  getRotateAngle,
  getTransformHandles,
  resizeElement,
  rotateElement,
} from "@core/elements/transform";
import {
  CanvasElement,
  TransformingElement,
  CanvasObject,
} from "@core/elements/types";
import {
  hitTestRotatedBoxInBox,
  hitTestRotatedBox,
  hitTestTransformHandles,
} from "@core/hitTest";
import { Errors } from "@core/logs";
import { CanvasPointer } from "@core/pointer";
import renderFrame from "@core/renderer";
import { DrawingToolLabel, ToolLabel } from "@core/tools";
import { AppState, XYCoords, BoundingBox } from "@core/types";
import * as utils from "@core/utils";
import "@css/App.scss";

declare global {
  interface Window {
    appData: {
      state: () => Readonly<AppState>;
      creatingElement: () => CanvasElement | null;
      editingElement: () => CanvasElement | null;
      transformingElements: () => TransformingElement[];
      pointer: () => CanvasPointer | null;
      elementLayer: () => ElementLayer;
      setState: (data: Pick<AppState, keyof AppState>) => void;
    };
  }
}

type ElementHandlerMap = Map<CanvasElement["type"], ElementHandler>;

class App extends React.Component<Record<string, never>, AppState> {
  canvas: HTMLCanvasElement | null = null;
  pointer: CanvasPointer | null = null;
  elementLayer = new ElementLayer(this.onElementLayerUpdate.bind(this));
  elementHandlers: ElementHandlerMap = new Map();
  actionManager: ActionManager;
  quickActions: QuickActionType[];

  creatingElement: CanvasElement | null = null;
  editingElement: CanvasElement | null = null;
  transformingElements: TransformingElement[] = [];

  getters = {
    state: () => this.state,
    creatingElement: () => this.creatingElement,
    editingElement: () => this.editingElement,
    transformingElements: () => this.transformingElements,
    pointer: () => this.pointer,
    elementLayer: () => this.elementLayer,
    setState: (data: Pick<AppState, keyof AppState>) => this.setState(data),
  };

  constructor(props: Record<string, never>) {
    super(props);

    this.state = DefaultObjects.defaultAppState();
    this.quickActions = DefaultObjects.defaultQuickActions();
    this.actionManager = new ActionManager(this.getters);
    this.actionManager.registerActions(CoreActions);
    this.actionManager.registerBindings(CoreBindings);
    this.setElementHandlers();

    if (import.meta.env.DEV) window.appData = this.getters;
  }

  getElementHandler(element: CanvasElement) {
    const handler = this.elementHandlers.get(element.type);
    if (!handler) throw Errors.UnknownElement(element.type);
    return handler;
  }

  getElementHandlerFromTool(tool: DrawingToolLabel) {
    let handler: ElementHandler | undefined;
    switch (tool) {
      case "Freedraw":
        handler = this.elementHandlers.get("freedraw");
        break;
      case "Text":
        handler = this.elementHandlers.get("text");
        break;
      case "Ellipse":
        handler = this.elementHandlers.get("ellipse");
        break;
      case "Rectangle":
        handler = this.elementHandlers.get("rect");
        break;
      default:
        break;
    }
    if (!handler) throw Errors.UnknownTool(tool);
    return handler;
  }

  getElementAtCoords(coords: XYCoords): CanvasElement | null {
    const elements = this.elementLayer.getAllElements();

    for (let i = 0; i < elements.length; i += 1) {
      const element = elements[i];
      const handler = this.getElementHandler(element);

      if (handler.hitTest(element, coords)) {
        return element;
      }
    }

    return null;
  }

  getObjectAtCoords(coords: XYCoords): CanvasObject {
    const selectedElements = this.elementLayer.getSelectedElements();

    const hitElement = this.getElementAtCoords(coords);

    if (selectedElements.length) {
      const selectionBox = utils.getSurroundingBoundingBox(selectedElements);
      if (hitTestRotatedBox(selectionBox, coords)) {
        return {
          type: "selectionBox",
          elements: selectedElements,
          box: selectionBox,
          // if element is hit and selection is also hit, then element was
          // definitely hit through the selection
          hitElement,
        };
      }

      const { zoom } = this.state;
      const handles = getTransformHandles(selectionBox, zoom);
      const hitHandle = hitTestTransformHandles(handles, coords, zoom);

      if (hitHandle) {
        return {
          type: "transformHandle",
          elements: selectedElements,
          box: selectionBox,
          handle: hitHandle,
        };
      }
    }

    if (hitElement) return { type: "element", element: hitElement };

    // nothing hit
    return { type: null };
  }

  private getElementsWithinBox(box: BoundingBox) {
    const allElements = this.elementLayer.getAllElements();
    const hitElements: CanvasElement[] = [];

    for (let i = 0; i < allElements.length; i += 1) {
      const element = allElements[i];

      if (hitTestRotatedBoxInBox(element, box)) {
        hitElements.push(element);
      }
    }

    return hitElements;
  }

  private startEditing(element: CanvasElement) {
    const handler = this.getElementHandler(element);

    handler.onEditStart(element);
    this.setState({ usermode: USERMODE.EDITING });
    this.creatingElement = null;
    this.editingElement = element;
    this.transformingElements.length = 0;
  }

  private stopEditing(element: CanvasElement) {
    const handler = this.getElementHandler(element);

    handler.onEditEnd(element);
    this.setState({ usermode: USERMODE.IDLE });
    this.creatingElement = null;
    this.editingElement = null;
    this.transformingElements.length = 0;
  }

  // setup functions
  private setCanvasRef = (canvas: HTMLCanvasElement) => {
    if (canvas) this.canvas = canvas;
  };

  private setElementHandlers() {
    this.elementHandlers.set("freedraw", new FreedrawHandler(this.getters));
    this.elementHandlers.set("text", new TextHandler(this.getters));
    this.elementHandlers.set("ellipse", new EllipseHandler(this.getters));
    this.elementHandlers.set("rect", new RectHandler(this.getters));
  }

  // local event handlers
  private onToolChange = (tool: ToolLabel) => {
    this.setState({ activeTool: tool });
  };

  private onElementLayerUpdate() {
    this.setState({});
  }

  private onDesignMenuUpdate = (
    elements: CanvasElement[],
    mutations: object,
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

  private removeEventListeners() {
    window.removeEventListener("pointermove", this.onWindowPointerMove);
    window.removeEventListener("pointerup", this.onWindowPointerUp);
    window.removeEventListener("wheel", this.onWindowWheel);
  }

  private onCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.buttons !== 1) return; // only handle primary key

    this.pointer = new CanvasPointer(e.nativeEvent, this.getters.state);
    const pointerPosition = this.pointer.currentPosition;

    if (this.state.usermode === USERMODE.EDITING) {
      const hit = this.getObjectAtCoords(pointerPosition);
      if (hit.type === "element" && hit.element === this.editingElement) return;
      // if user click anything else while editing, editing has ended
      this.stopEditing(this.editingElement!);
      // if editing ends, continue normal flow
    }

    if (this.state.activeTool === "Hand") return;
    if (this.state.activeTool === "Selection") {
      const hit = this.getObjectAtCoords(pointerPosition);
      this.pointer.hit = hit;

      switch (hit.type) {
        case "element": {
          const elements = [hit.element];
          if (!this.pointer.shiftKey) this.elementLayer.unselectAllElements();
          this.elementLayer.selectElements(elements);
          this.setState({ usermode: USERMODE.DRAGGING });
          this.transformingElements = utils.createTransformElements(elements);
          break;
        }

        case "selectionBox":
          this.setState({ usermode: USERMODE.DRAGGING });
          this.transformingElements = utils.createTransformElements(
            hit.elements,
          );
          break;

        case "transformHandle": {
          const mode =
            hit.handle.type === "rotate"
              ? USERMODE.ROTATING
              : USERMODE.RESIZING;

          this.setState({ usermode: mode });
          this.transformingElements = utils.createTransformElements(
            hit.elements,
          );
          break;
        }

        default:
          if (!this.pointer.shiftKey) this.elementLayer.unselectAllElements();
      }
      return;
    }

    const handler = this.getElementHandlerFromTool(this.state.activeTool);
    const element = handler.create({ ...pointerPosition, w: 0, h: 0 });

    this.elementLayer.addElement(element);
    this.elementLayer.unselectAllElements();
    this.elementLayer.selectElements([element]);
    this.creatingElement = element;
    this.setState({ usermode: USERMODE.CREATING });
    handler.onCreateStart(element, this.pointer, e.nativeEvent);
  };

  private onWindowPointerMove = (e: PointerEvent) => {
    if (!this.pointer) return;
    this.pointer.move(e);

    switch (this.state.usermode) {
      case USERMODE.EDITING:
        break;

      case USERMODE.CREATING: {
        this.onElementCreate(this.creatingElement!, e);
        break;
      }

      case USERMODE.DRAGGING:
        this.onElementDrag(this.transformingElements, e);
        break;

      case USERMODE.ROTATING:
        this.onElementRotate(this.transformingElements, e);
        break;

      case USERMODE.RESIZING:
        this.onElementResize(this.transformingElements, e);
        break;

      case USERMODE.IDLE: {
        /** pointer drag is treated as a box selection */
        const { dragBox } = this.pointer;
        const selectionBox = utils.normalizeBox(dragBox);
        const selectedElements = this.getElementsWithinBox(selectionBox);

        this.setState({ selectionHighlight: selectionBox });
        this.elementLayer.selectElements(selectedElements);
        break;
      }

      default:
        throw Errors.UnknownUserMode(this.state.usermode);
    }
  };

  private onWindowPointerUp = (e: PointerEvent) => {
    if (!this.pointer) return;

    const { hit } = this.pointer;

    if(hit.type === "selectionBox" && hit.hitElement && !this.pointer.didMove) {
      this.pointer.hit = { type: "element", element: hit.hitElement };
      this.elementLayer.unselectAllElements();
      this.elementLayer.selectElements([ hit.hitElement ]);
    }

    switch (this.state.usermode) {
      case USERMODE.EDITING:
      case USERMODE.IDLE:
        break;

      case USERMODE.CREATING: {
        const element = this.creatingElement!;
        const handler = this.getElementHandler(element);

        handler.onCreateEnd(element, e);

        if (
          handler.features_supportsEditing &&
          handler.features_startEditingOnCreateEnd
        ) {
          this.startEditing(element);
          break;
        }

        this.setState({ usermode: USERMODE.IDLE });
        this.creatingElement = null;
        this.editingElement = null;
        this.transformingElements.length = 0;
        break;
      }

      default:
        this.setState({ usermode: USERMODE.IDLE });
        this.creatingElement = null;
        this.editingElement = null;
        this.transformingElements.length = 0;
    }

    this.setState({ selectionHighlight: null });
    this.pointer = null;
  };

  private onCanvasDblClick = (e: React.MouseEvent) => {
    // when user double clicks, attempt to edit selected element

    if (this.state.activeTool !== "Selection") return;
    if (this.state.usermode === USERMODE.EDITING) return;

    const pointerCoords = CanvasPointer.getCoords(e.nativeEvent, this.state);
    const doubleClickedElement = this.getElementAtCoords(pointerCoords);
    if (!doubleClickedElement) return;

    const handler = this.getElementHandler(doubleClickedElement);
    if (handler.features_supportsEditing) {
      this.startEditing(doubleClickedElement);
    }
  };

  private onCanvasContextMenu = (e: React.MouseEvent) => {
    const pointerCoords = CanvasPointer.getCoords(e.nativeEvent, this.state);
    const hit = this.getObjectAtCoords(pointerCoords);

    switch (this.state.usermode) {
      case USERMODE.EDITING: {
        if (hit.type === "element" && hit.element === this.editingElement) {
          e.preventDefault();
        } else this.stopEditing(this.editingElement!);
        break;
      }

      case USERMODE.CREATING: {
        const element = this.creatingElement!;
        const handler = this.getElementHandler(element);

        const ev = ElementHandler.EventFromMouse(e.nativeEvent);
        handler.onCreateEnd(element, ev);
        this.setState({ usermode: USERMODE.IDLE });
        this.creatingElement = null;
        break;
      }

      default:
    }

    switch (hit.type) {
      case "element":
        this.elementLayer.unselectAllElements();
        this.elementLayer.selectElements([hit.element]);
        break;
      case "selectionBox":
        this.elementLayer.unselectAllElements();
        this.elementLayer.selectElements(hit.elements);
        break;
      default:
        break;
    }
    const items: ContextMenuItem[] = [];

    items.push({
      type: "button",
      label: "Select All",
      exec: () => this.actionManager.execute("core:elements.selectAll"),
    });

    if (hit.type === "element" || hit.type !== "selectionBox") {
      items.push({
        type: "button",
        label: "Delete",
        exec: () => {
          this.elementLayer.getSelectedElements().forEach((element) => {
            this.elementLayer.deleteElement(element);
          });
        },
      });
    }

    this.setState({ contextMenuItems: items });
  };

  private onElementCreate(element: CanvasElement, e: PointerEvent) {
    if (!this.pointer) return;
    const handler = this.getElementHandler(element);
    handler.onCreateDrag(element, this.pointer, e);
  }

  private onElementDrag(elements: TransformingElement[], e: PointerEvent) {
    const { offset, hit } = this.pointer!;

    if (hit.type !== "element" && hit.type !== "selectionBox") {
      throw Errors.ImpossibleState(
        `attempted to drag while pointer hit: '${hit.type}'`,
      );
    }

    for (let i = 0; i < elements.length; i += 1) {
      const { element, initialElement } = elements[i];
      const { x, y } = initialElement;
      let position = { x: x + offset.x, y: y + offset.y };

      if (!e.ctrlKey) position = utils.snapToGrid(position, this.state.grid);

      this.elementLayer.mutateElement(element, position);
    }
  }

  private onElementRotate(elements: TransformingElement[], e: PointerEvent) {
    if (!this.pointer) return;

    const { hit } = this.pointer!;
    if (hit.type !== "transformHandle") {
      throw Errors.ImpossibleState(
        `attempted to rotate while dragging: '${hit.type}'`,
      );
    }

    const position = this.pointer!.currentPosition;
    let angle = getRotateAngle(hit, position);

    if (!e.ctrlKey) {
      // snap rotation if ctrl is not pressed
      const threshold = ROTATION_SNAP_THRESHOLD;
      angle = Math.round(angle / threshold) * threshold;
    }

    for (let i = 0; i < elements.length; i += 1) {
      const tElement = elements[i];
      const mutations = rotateElement(tElement, hit, angle);
      this.elementLayer.mutateElement(tElement.element, mutations);
    }
  }

  private onElementResize(elements: TransformingElement[], e: PointerEvent) {
    if (!this.pointer) return;

    const { hit } = this.pointer;
    if (hit.type !== "transformHandle") {
      throw Errors.ImpossibleState(
        `attempted to resize while dragging: '${hit.type}'`,
      );
    }

    let position = this.pointer.currentPosition;
    if (!e.ctrlKey) {
      // snap pointer if ctrl is not pressed (this makes the scale snapped)
      position = utils.snapToGrid(position, this.state.grid);
    }

    const scale = getResizeScale(hit, position);
    for (let i = 0; i < elements.length; i += 1) {
      const tElement = elements[i];
      const mutations = resizeElement(tElement, hit, scale);
      this.elementLayer.mutateElement(tElement.element, mutations);
    }
  }

  private onWindowWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.metaKey || e.ctrlKey) {
      const direction = -Math.sign(e.deltaY);
      const value = this.state.zoom + direction * ZOOM_STEP;
      const zoomState = utils.getNewZoomState(value, e, this.state);

      this.setState(zoomState);
    }
  };

  // react lifecycle
  componentDidMount() {
    this.addEventListeners();
    this.setState({});
  }

  componentDidUpdate() {
    const modesToHideBoundingBox = [USERMODE.CREATING, USERMODE.ROTATING];
    renderFrame({
      canvas: this.canvas!,
      state: this.state,
      scale: window.devicePixelRatio,
      elements: this.elementLayer.getAllElements(),
      selectedElements: this.elementLayer.getSelectedElements(),
      hideBoundingBoxes: modesToHideBoundingBox.includes(this.state.usermode),
      elementHandlers: this.elementHandlers,
    });
  }

  componentWillUnmount() {
    this.removeEventListeners();
  }

  // rendering
  render() {
    const canvasWidth = this.state.appBounds.w;
    const canvasHeight = this.state.appBounds.h;
    const canvasVirtualWidth = canvasWidth * window.devicePixelRatio;
    const canvasVirtualHeight = canvasHeight * window.devicePixelRatio;
    const selectedElements = this.elementLayer.getSelectedElements();

    return (
      <div className="app">
        {!!selectedElements.length && (
          <DesignMenu
            selectedElements={selectedElements}
            onChange={this.onDesignMenuUpdate}
          />
        )}
        <div className="tools">
          <ToolBar
            activeTool={this.state.activeTool}
            onToolChange={this.onToolChange}
          />
          <QuickActions
            actionManager={this.actionManager}
            actions={this.quickActions}
          />
        </div>
        <ContextMenu items={this.state.contextMenuItems}>
          <canvas
            data-testid="app-canvas"
            width={canvasVirtualWidth}
            height={canvasVirtualHeight}
            style={{ width: canvasWidth, height: canvasHeight }}
            ref={this.setCanvasRef}
            onPointerDown={this.onCanvasPointerDown}
            onDoubleClick={this.onCanvasDblClick}
            onContextMenu={this.onCanvasContextMenu}
          />
        </ContextMenu>
      </div>
    );
  }
}

export default App;
