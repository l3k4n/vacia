import hotkeys from "hotkeys-js";
import { validateKeys } from "./keys";
import { Action, ActionManagerAppData } from "./types";
import { Errors } from "@core/logs";

const HOTKEYS_ENABLED_SCOPE = "enabled";
const HOTKEYS_DISABLED_SCOPE = "disabled";
const HOTKEYS_CONFIG = {
  keyup: false,
  keydown: true,
  scope: HOTKEYS_ENABLED_SCOPE,
};
const HOTKEYS_IGNORE = ["input", "textarea", "select", "button", "a"];
const HOTKEYS_FILTER = (e: KeyboardEvent) => {
  const tagname = (e.target as HTMLElement).tagName.toLowerCase();
  return !HOTKEYS_IGNORE.includes(tagname);
};

const actionMap = new Map<string, Action>();

export function registerAction(action: Action) {
  if (actionMap.has(action.id)) throw Errors.DuplicateAction(action.id);
  actionMap.set(action.id, action);
  return action;
}

export class ActionManager {
  private bindings = new Map<string, string>();
  private appData: ActionManagerAppData;

  constructor(appData: ActionManagerAppData) {
    this.appData = appData;
    hotkeys.filter = HOTKEYS_FILTER;
    this.enable();
  }

  isBindingSet(binding: string) {
    return this.bindings.has(binding);
  }

  registerBinding(binding: string, actionId: string) {
    // prevent duplicates
    this.removeBinding(binding);
    // drop invalid bindings
    if (!validateKeys(binding.split("+"))) return;
    // add binding to hotkeys
    this.bindings.set(binding, actionId);
    hotkeys(binding, HOTKEYS_CONFIG, (e) => {
      e.preventDefault();
      this.executeBinding(binding);
    });
  }

  registerBindingMap(map: Record<string, string>) {
    Object.keys(map).forEach((key) => {
      this.registerBinding(key, map[key]);
    });
  }

  removeBinding(binding: string) {
    if(!binding) return;
    hotkeys.unbind(binding, HOTKEYS_ENABLED_SCOPE);
    this.bindings.delete(binding);
  }

  enable() {
    hotkeys.setScope(HOTKEYS_ENABLED_SCOPE);
  }

  disable() {
    hotkeys.setScope(HOTKEYS_DISABLED_SCOPE);
  }

  executeBinding(binding: string) {
    const mappedActionId = this.bindings.get(binding);
    if(!mappedActionId) return;

    const mappedAction = actionMap.get(mappedActionId);
    if(!mappedAction) return;

    this.executeAction(mappedAction);
  }

  executeAction(action: Action) {
    action.exec(this.appData);
  }
}
