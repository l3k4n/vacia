import hotkeys from "hotkeys-js";
import { allowedKeys } from "./allowedKeys";
import ElementLayer from "@core/elementLayer";
import { CanvasElement, TransformingElement } from "@core/elements/types";
import { CanvasPointer } from "@core/pointer";
import { AppState } from "@core/types";

const HOTKEYS_CONFIG = { keyup: false, keydown: true };
const HOTKEYS_IGNORE = ["input", "textarea", "select", "button", "a"];
const HOTKEYS_FILTER = (e: KeyboardEvent) => {
  const tagname = (e.target as HTMLElement).tagName.toLowerCase();
  return !HOTKEYS_IGNORE.includes(tagname);
};

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
  label: string;
  // eslint-disable-next-line
  exec(args: ActionManagerAppData): void;
}

type ActionMap = Record<string, Action>;
type BindingMap = Record<string, string>;

function validateBinding(binding: string) {
  return binding.split("+").every((key) => allowedKeys.has(key));
}

export class ActionManager {
  private actions: ActionMap = Object.create(null);
  private bindings: BindingMap = Object.create(null);
  private appData: ActionManagerAppData;

  constructor(appData: ActionManagerAppData) {
    this.appData = appData;
    hotkeys.filter = HOTKEYS_FILTER;
  }

  private resetKeybindings() {
    // remove all bindings
    hotkeys.unbind();

    Object.keys(this.bindings).forEach((binding) => {
      const actionId = this.bindings[binding];
      const action = this.actions[actionId];
      if (!action) return;

      hotkeys(binding, HOTKEYS_CONFIG, (e) => {
        e.preventDefault();
        action.exec(this.appData);
      });
    });
  }

  actionExists(id: string) {
    return !!this.actions[id];
  }

  bindingExists(binding: string) {
    return !!this.bindings[binding];
  }

  registerActions(actionMap: ActionMap) {
    Object.keys(actionMap).forEach((id) => {
      if (!this.actionExists(id)) {
        this.actions[id] = actionMap[id];
      }
    });
    this.resetKeybindings();
  }

  registerBindings(bindingMap: BindingMap) {
    Object.keys(bindingMap).forEach((binding) => {
      if (validateBinding(binding) && !this.bindingExists(binding)) {
        this.bindings[binding] = bindingMap[binding];
      }
    });
    this.resetKeybindings();
  }

  execute(actionId: string) {
    this.actions[actionId]?.exec(this.appData);
  }
}
