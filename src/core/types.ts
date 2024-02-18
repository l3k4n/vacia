import { DrawingTools, ControlTools } from "./tools";
import { USERMODE } from "@constants";

export type XYCoords = { x: number; y: number };
export type Point = [number, number];
export type BoundingBox = XYCoords & { w: number; h: number };
export type RotatedBoundingBox = BoundingBox & { rotate: number };
export type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export interface ContextMenuSeparator {
  type: "separator";
}
export interface ContextMenuButton {
  type: "button";
  label: string;
  icon?: string | null;
  binding?: string;
  exec: () => void;
}
export interface ContextMenuDropdown {
  type: "dropdown";
  label: string;
  options: (ContextMenuButton | ContextMenuSeparator)[];
}
export type ContextMenuItem =
  | ContextMenuButton
  | ContextMenuDropdown
  | ContextMenuSeparator;

interface AbstractElement extends BoundingBox {
  fill: string;
  rotate: number;
  flippedX: boolean;
  flippedY: boolean;
}
export interface ShapeElement extends AbstractElement {
  type: "shape";
  shape: "rect" | "ellipse";
}
export interface FreedrawElement extends AbstractElement {
  type: "freedraw";
  path: Point[];
}
export interface TextElement extends AbstractElement {
  type: "text";
  fontSize: number;
  fontFamily: string;
  text: string;
}

export type CanvasElement = Readonly<
  ShapeElement | FreedrawElement | TextElement
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CanvasElementMutations = { [key: string]: any };

/** Toolbar tools that have render elements (e.g Ellipse tool) */
export type DrawingToolLabel = (typeof DrawingTools)[number]["label"];
/** Toolbar tools that don't map to real elements (e.g Select tool) */
export type ControlToolLabel =
  (typeof ControlTools)[keyof typeof ControlTools]["label"];
/** Toolbar tool names */
export type ToolLabel = DrawingToolLabel | ControlToolLabel;

export type ToolbarPosition = "top" | "left" | "right" | "bottom";

export interface AppState {
  width: number;
  height: number;
  activeTool: ToolLabel;
  grid: { type: "line" | "none"; size: number };
  /** canvas offset from { x: 0, y: 0 } */
  scrollOffset: XYCoords;
  zoom: number;
  toolbarPosition: ToolbarPosition;
  /** bounding box (in virtual coords) to highlight when drag selecting */
  selectionHighlight: BoundingBox | null;
  usermode: USERMODE;
  contextMenu: {
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null;
}

export type TransformHandle = "ne" | "nw" | "se" | "sw" | "rotate";
export type TransformHandleData = XYCoords & { type: TransformHandle };

/* pointer state since the last pointer down */
export interface PointerState {
  origin: XYCoords;
  /** pointer drag data */
  drag: {
    /** distance between pointer down origin and current pointer position */
    offset: XYCoords;
    /** drag offset of the last pointermove event */
    previousOffset: XYCoords;
    /** since drag offset might vome back to it's original position this
     * indicates whether a drag occured or not */
    occurred: boolean;
  };
  hit: {
    /** element that was clicked when pointer down occurred  */
    element: CanvasElement | null;
    transformHandle: TransformHandle | null;
  };
  shiftKey: boolean;
  ctrlKey: boolean;
}

/** element and its bounding box before any transforms were applied */
export interface TransformingElement {
  element: CanvasElement;
  initialElement: CanvasElement;
}

export interface IElementLayer {
  addElement(element: CanvasElement): void;
  deleteElement(element: CanvasElement): void;
  selectElements(elements: CanvasElement[]): void;
  unselectElements(elements: CanvasElement[]): void;
  unselectAllElements(): void;
  getSelectedElements(): CanvasElement[];
  getAllElements(): CanvasElement[];
  mutateElement(element: CanvasElement, mutations: object): void;
}

export interface AppData {
  readonly state: AppState;
  readonly editingElement: CanvasElement | null;
  readonly transformingElements: TransformingElement[];
  readonly pointer: PointerState | null;
  readonly elementLayer: IElementLayer;
  readonly bounds: BoundingBox;
  setState<K extends keyof AppState>(newState: Pick<AppState, K>): void;
  setEditingElement(element: CanvasElement): void;
}

type MixedObject = Readonly<{ [x: symbol]: number; toString: () => string }>;
export type Mixed<T> = { [K in keyof T]: T[K] | MixedObject };
export type SelectionProps = Readonly<Mixed<BoundingBox & { fill: string }>>;
export type SelectionMetadata = Readonly<{
  selectedTypes: Set<CanvasElement["type"]>;
  multipleElements: boolean;
}>;
export interface SectionProps {
  value: SelectionProps;
  metadata: SelectionMetadata;
  onChange: (value: Partial<SelectionProps>) => void;
}
export type SectionComponent = (props: SectionProps) => JSX.Element;

export interface Action {
  label: string;
  exec(args: AppData): void;
}
