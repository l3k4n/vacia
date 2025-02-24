import React from "react";
import ContextMenu from "@components/ContextMenu";
import DesignMenu from "@components/DesignMenu";
import QuickActions from "@components/QuickActions";
import ToolBar from "@components/ToolBar";
import { USERMODE, ZOOM_STEP, DEFAULT_TOOL } from "@constants";
import { ActionManager } from "@core/actionManager";
import { createContextMenuItems } from "@core/contextMenuItems";
import * as DefaultObjects from "@core/defaultObjects";
import ElementLayer from "@core/elementLayer";
import {
  EllipseHandler,
  FreedrawHandler,
  RectHandler,
  TextHandler,
  createPartialElement,
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
      setState<K extends keyof AppState>(state: Pick<AppState, K>): void;
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
  renderableActions = DefaultObjects.defaultRenderableActions();

  creatingElement: CanvasElement | null = null;
  editingElement: CanvasElement | null = null;
  transformingElements: TransformingElement[] = [];

  appdata = {
    state: () => this.state,
    creatingElement: () => this.creatingElement,
    editingElement: () => this.editingElement,
    transformingElements: () => this.transformingElements,
    pointer: () => this.pointer,
    elementLayer: () => this.elementLayer,
    setState: (data: Pick<AppState, keyof AppState>) => this.setState(data),
    requestEditStart: this.requestEditStart.bind(this),
    makeUserIdle: this.makeUserIdle.bind(this),
  };

  constructor(props: Record<string, never>) {
    super(props);

    this.state = DefaultObjects.defaultAppState();
    this.actionManager = new ActionManager(this.appdata);
    this.actionManager.registerBindingMap(DefaultObjects.defaultBindings());
    this.setElementHandlers();

    if (import.meta.env.DEV) window.appData = this.appdata;
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
    let nonInteractiveElementHit: CanvasElement | null = null;

    for (let i = elements.length - 1; i >= 0; i -= 1) {
      const element = elements[i];
      if (element.deleted) continue;

      const handler = this.getElementHandler(element);

      if (!handler.hitTest(element, coords)) continue;
      if (!nonInteractiveElementHit) nonInteractiveElementHit = element;
      if (utils.isInteractive(element)) return element;
    }

    return nonInteractiveElementHit;
  }

  getInteractiveElementAtCoords(coords: XYCoords): CanvasElement | null {
    const elements = this.elementLayer.getInteractiveElements();

    for (let i = elements.length - 1; i >= 0; i -= 1) {
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

    if (hitElement && !utils.isInteractive(hitElement)) {
      return {
        type: "nonInteractiveElement",
        element: hitElement,
      };
    }
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
    const allElements = this.elementLayer.getInteractiveElements();
    const hitElements: CanvasElement[] = [];

    for (let i = 0; i < allElements.length; i += 1) {
      const element = allElements[i];

      if (hitTestRotatedBoxInBox(element, box)) {
        hitElements.push(element);
      }
    }

    return hitElements;
  }

  makeUserIdle() {
    switch (this.state.usermode) {
      case USERMODE.EDITING: {
        if (!this.editingElement) break;

        const handler = this.getElementHandler(this.editingElement);
        handler.onEditEnd(this.editingElement);
        break;
      }

      case USERMODE.CREATING: {
        if (!this.creatingElement) break;

        const handler = this.getElementHandler(this.creatingElement);
        handler.onCreateEnd(this.creatingElement);

        if (!this.state.preferences.lockCurrentTool) {
          this.setState({ activeTool: DEFAULT_TOOL });
        }
        break;
      }

      default:
        break;
    }

    this.elementLayer.mergeBatchedHistoryEntries();
    this.setState({ usermode: USERMODE.IDLE });
  }

  private requestEditStart(element: CanvasElement) {
    const handler = this.getElementHandler(element);
    if (!handler.features_supportsEditing) return;

    this.makeUserIdle();
    this.elementLayer.batchIncomingHistoryEntries();
    this.editingElement = element;
    this.setState({ usermode: USERMODE.EDITING });
    handler.onEditStart(element);
  }

  // setup functions
  private setCanvasRef = (canvas: HTMLCanvasElement) => {
    if (canvas) this.canvas = canvas;
  };

  private setElementHandlers() {
    this.elementHandlers.set("freedraw", new FreedrawHandler(this.appdata));
    this.elementHandlers.set("text", new TextHandler(this.appdata));
    this.elementHandlers.set("ellipse", new EllipseHandler(this.appdata));
    this.elementHandlers.set("rect", new RectHandler(this.appdata));
  }

  // local event handlers
  private onToolChange = (tool: ToolLabel) => {
    this.setState({ activeTool: tool });
    this.elementLayer.unselectAllElements();
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

    this.pointer = new CanvasPointer(e.nativeEvent, this.appdata.state);
    const pointerPosition = this.pointer.currentPosition;
    const hit = this.getObjectAtCoords(pointerPosition);

    if (
      this.state.usermode === USERMODE.EDITING &&
      hit.type === "element" &&
      hit.element === this.editingElement
    ) {
      // ignore clicks on element while editing
      return;
    }

    this.makeUserIdle();

    if (this.state.activeTool === "Hand") {
      this.setState({ usermode: USERMODE.PANNING });
      return;
    }

    if (this.state.activeTool === "Selection") {
      this.pointer.hit = hit;

      switch (hit.type) {
        case "element": {
          const elements = [hit.element];
          if (!this.pointer.origin_shiftKey) {
            this.elementLayer.unselectAllElements();
          }
          this.elementLayer.selectElements(elements);
          this.setState({ usermode: USERMODE.DRAGGING });
          this.transformingElements = utils.createTransformElements(elements);
          this.elementLayer.batchIncomingHistoryEntries("Dragging Element");
          break;
        }

        case "selectionBox":
          this.setState({ usermode: USERMODE.DRAGGING });
          this.transformingElements = utils.createTransformElements(
            hit.elements,
          );
          this.elementLayer.batchIncomingHistoryEntries("Dragging Selection");
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
          this.elementLayer.batchIncomingHistoryEntries("Transforming Element");
          break;
        }

        default:
          if (!this.pointer.origin_shiftKey) {
            this.elementLayer.unselectAllElements();
          }
      }
      return;
    }

    const handler = this.getElementHandlerFromTool(this.state.activeTool);
    const partialElement = createPartialElement({
      ...pointerPosition,
      w: 0,
      h: 0,
    });
    const element = handler.create(partialElement);

    this.elementLayer.batchIncomingHistoryEntries("Creating Element");
    this.elementLayer.addElement(element);
    this.elementLayer.unselectAllElements();
    this.elementLayer.selectElements([element]);
    this.creatingElement = element;
    this.setState({ usermode: USERMODE.CREATING });
    handler.onCreateStart(element, this.pointer);
  };

  private onWindowPointerMove = (e: PointerEvent) => {
    if (!this.pointer) return;
    this.pointer.move(e);

    switch (this.state.usermode) {
      case USERMODE.EDITING:
        break;

      case USERMODE.CREATING: {
        this.onElementCreate(this.creatingElement!);
        break;
      }

      case USERMODE.DRAGGING:
        this.onElementDrag(this.transformingElements);
        break;

      case USERMODE.ROTATING:
        this.onElementRotate(this.transformingElements);
        break;

      case USERMODE.RESIZING:
        this.onElementResize(this.transformingElements);
        break;

      case USERMODE.PANNING: {
        const offset = this.pointer.screen_offset;
        const prevOffset = this.pointer.previous_screen_offset;
        const x = this.state.scrollOffset.x + offset.x - prevOffset.x;
        const y = this.state.scrollOffset.y + offset.y - prevOffset.y;

        this.setState({ scrollOffset: { x, y } });
        break;
      }

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

  private onWindowPointerUp = () => {
    if (!this.pointer) return;

    const { hit } = this.pointer;

    if (
      hit.type === "selectionBox" &&
      hit.hitElement &&
      !this.pointer.didMove
    ) {
      this.pointer.hit = { type: "element", element: hit.hitElement };
      this.elementLayer.unselectAllElements();
      this.elementLayer.selectElements([hit.hitElement]);
    }

    // keep these because 'makeUserIdle' will reset them
    const elementBeingCreated = this.creatingElement;
    const previousUsermode = this.state.usermode;

    this.makeUserIdle();
    this.setState({ selectionHighlight: null });
    this.pointer = null;

    if (
      elementBeingCreated &&
      previousUsermode === USERMODE.CREATING &&
      this.getElementHandler(elementBeingCreated)
        .features_startEditingOnCreateEnd
    ) {
      this.requestEditStart(elementBeingCreated);
    }
  };

  private onCanvasDblClick = (e: React.MouseEvent) => {
    // when user double clicks, attempt to edit selected element

    if (this.state.activeTool !== "Selection") return;
    if (this.state.usermode === USERMODE.EDITING) return;

    const pointerCoords = utils.toViewportCoords(e.nativeEvent, this.state);
    const doubleClickedElement =
      this.getInteractiveElementAtCoords(pointerCoords);
    if (!doubleClickedElement) return;

    this.requestEditStart(doubleClickedElement);
  };

  private onCanvasContextMenu = (e: React.MouseEvent) => {
    const pointerCoords = utils.toViewportCoords(e.nativeEvent, this.state);
    const hit = this.getObjectAtCoords(pointerCoords);
    this.pointer = null;

    if (
      this.state.usermode === USERMODE.EDITING &&
      hit.type === "element" &&
      hit.element === this.editingElement
    ) {
      // ignore contextmenu while editing
      e.preventDefault();
      return;
    }

    this.makeUserIdle();

    this.setState({
      contextMenuItems: createContextMenuItems(
        hit,
        this.state,
        this.elementLayer,
        this.actionManager,
      ),
    });

    if (hit.type === "element" || hit.type === "selectionBox") {
      // @ts-ignore
      const elements = hit.elements || [hit.element];
      this.elementLayer.unselectAllElements();
      this.elementLayer.selectElements(elements);
    }
  };

  private onElementCreate(element: CanvasElement) {
    if (!this.pointer) return;
    const handler = this.getElementHandler(element);
    handler.onCreateDrag(element, this.pointer);
  }

  private onElementDrag(elements: TransformingElement[]) {
    if (!this.pointer) return;
    const { offset, hit } = this.pointer;

    if (hit.type !== "element" && hit.type !== "selectionBox") {
      throw Errors.ImpossibleState(
        `attempted to drag while pointer hit: '${hit.type}'`,
      );
    }

    for (let i = 0; i < elements.length; i += 1) {
      const { element, initialElement } = elements[i];
      const { x, y } = initialElement;
      let position = { x: x + offset.x, y: y + offset.y };

      if (!this.pointer.current_ctrlKey) {
        position = utils.snapToGrid(position, this.state.preferences.grid);
      }

      this.elementLayer.mutateElement(element, position);
    }
  }

  private onElementRotate(elements: TransformingElement[]) {
    if (!this.pointer) return;

    const { hit } = this.pointer!;
    if (hit.type !== "transformHandle") {
      throw Errors.ImpossibleState(
        `attempted to rotate while dragging: '${hit.type}'`,
      );
    }

    const position = this.pointer!.currentPosition;
    let angle = getRotateAngle(hit, position);

    if (!this.pointer.current_ctrlKey) {
      // snap rotation if ctrl is not pressed
      angle = utils.snapAngleToGrid(angle, this.state.preferences.grid);
    }

    for (let i = 0; i < elements.length; i += 1) {
      const tElement = elements[i];
      const mutations = rotateElement(tElement, hit, angle);
      const prevRotate = tElement.element.rotate;

      this.elementLayer.mutateElement(tElement.element, mutations);
      if (prevRotate !== tElement.element.rotate) {
        const handler = this.getElementHandler(tElement.element);
        handler.onRotate(tElement.element, tElement.initialElement, angle);
      }
    }
  }

  private onElementResize(elements: TransformingElement[]) {
    if (!this.pointer) return;

    const { hit } = this.pointer;
    if (hit.type !== "transformHandle") {
      throw Errors.ImpossibleState(
        `attempted to resize while dragging: '${hit.type}'`,
      );
    }

    let position = this.pointer.currentPosition;
    if (!this.pointer.current_ctrlKey) {
      // snap pointer if ctrl is not pressed (this makes the scale snapped)
      position = utils.snapToGrid(position, this.state.preferences.grid);
    }

    const scale = getResizeScale(hit, position);
    for (let i = 0; i < elements.length; i += 1) {
      const tElement = elements[i];
      const mutations = resizeElement(tElement, hit, scale);
      const { w: prevW, h: prevH } = tElement.element;

      this.elementLayer.mutateElement(tElement.element, mutations);
      if (prevW !== tElement.element.w || prevH !== tElement.element.h) {
        const handler = this.getElementHandler(tElement.element);
        handler.onResize(
          tElement.element,
          tElement.initialElement,
          scale[0],
          scale[1],
        );
      }
    }
  }

  private onWindowWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!e.metaKey && !e.ctrlKey) return;

    const direction = -Math.sign(e.deltaY);
    const value = this.state.zoom + direction * ZOOM_STEP;
    const zoomState = utils.getNewZoomState(value, e, this.state);
    this.setState(zoomState);
  };

  // react lifecycle
  componentDidMount() {
    this.addEventListeners();
    this.setState({});
  }

  componentDidUpdate(_: unknown, prevState: AppState) {
    // prevent all actions unless user is idle
    if (this.state.usermode === USERMODE.IDLE) this.actionManager.enable();
    else this.actionManager.disable();

    const viewChanged =
      prevState.zoom !== this.state.zoom ||
      prevState.scrollOffset.x !== this.state.scrollOffset.x ||
      prevState.scrollOffset.y !== this.state.scrollOffset.y;

    // inform handler if viewport updates while editing.
    // NOTE: this normally should not occur, but is handled just incase
    if (this.state.usermode === USERMODE.EDITING && viewChanged) {
      const handler = this.getElementHandler(this.editingElement!);
      handler.onEditViewStateChange(this.editingElement!);
    }

    const modesToHideBoundingBox = [
      USERMODE.ROTATING,
      USERMODE.EDITING,
    ];

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
    const dimensions = { width: window.innerWidth, height: window.innerHeight };
    const canvasVirtualWidth = dimensions.width * window.devicePixelRatio;
    const canvasVirtualHeight = dimensions.height * window.devicePixelRatio;
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
            toolLocked={this.state.preferences.lockCurrentTool}
            onToolChange={this.onToolChange}
            onToolLockChange={(lock) => {
              const preferences = { ...this.state.preferences };
              Object.assign(preferences, { lockCurrentTool: lock });
              this.setState({ preferences });
            }}
          />
          <QuickActions
            renderableActions={this.renderableActions}
            execute={(action) => this.actionManager.executeAction(action)}
          />
        </div>
        <ContextMenu items={this.state.contextMenuItems}>
          <canvas
            data-testid="app-canvas"
            width={canvasVirtualWidth}
            height={canvasVirtualHeight}
            style={dimensions}
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
