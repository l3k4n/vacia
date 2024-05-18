import ElementLayer from "@core/elementLayer";
import { CanvasElement, TransformingElement } from "@core/elements/types";
import { CanvasPointer } from "@core/pointer";
import { AppState } from "@core/types";

export interface ActionManagerAppData {
  state: () => AppState;
  creatingElement: () => CanvasElement | null;
  editingElement: () => CanvasElement | null;
  transformingElements: () => TransformingElement[];
  pointer: () => CanvasPointer | null;
  elementLayer: () => ElementLayer;
  setState<K extends keyof AppState>(newState: Pick<AppState, K>): void;
}

export interface Action {
  id: string;
  label: string;
  exec(args: ActionManagerAppData): void;
}
