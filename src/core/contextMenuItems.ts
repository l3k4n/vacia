import { ActionManager } from "./actionManager";
import { Action } from "./actionManager/types";
import {
  DeleteSelectionAction,
  LockSelectionAction,
  SelectAllAction,
  ToggleGridAction,
  UnlockAllAction,
} from "./actions";
import ElementLayer from "./elementLayer";
import { CanvasObject } from "./elements/types";
import { AppState } from "./types";
import { isInteractive } from "./utils";
import { ContextMenuItem } from "@components/ContextMenu";

type UnfilteredEntry = ContextMenuItem & { predicate?: boolean };

function createUtils(items: ContextMenuItem[], actionManager: ActionManager) {
  return {
    entry<T extends Omit<ContextMenuItem, "label" | "binding" | "exec">>(
      action: Action,
      partialEntry: T,
    ) {
      return Object.assign(partialEntry, {
        label: action.label,
        binding: actionManager.getAssignedBindings(action).join(", "),
        exec: () => actionManager.executeAction(action),
      }) as T & { label: string; binding: string; exec: () => void };
    },

    addGroup(predicate: boolean, entries: UnfilteredEntry[]) {
      if (!predicate) return;

      const filtered = entries.filter((entry) => {
        if (Object.hasOwn(entry, "predicate")) return entry.predicate;
        return true;
      });
      if (items.length && filtered.length) items.push({ type: "separator" });
      items.push(...filtered);
    },
  };
}

export function createContextMenuItems(
  hit: CanvasObject,
  state: AppState,
  elementLayer: ElementLayer,
  actionManager: ActionManager,
) {
  const items: ContextMenuItem[] = [];
  const { entry, addGroup } = createUtils(items, actionManager);

  // non-interactive elements
  addGroup(hit.type === null, [
    entry(SelectAllAction, {
      type: "button",
      disabled: elementLayer.getInteractiveElements().length < 1,
    }),
    entry(UnlockAllAction, {
      type: "button",
      disabled: elementLayer.getAllElements().filter(isInteractive).length < 1,
    }),
  ]);

  // preferences
  addGroup(hit.type === null, [
    entry(ToggleGridAction, {
      type: "checkbox",
      checked: !state.preferences.grid.disabled,
    }),
  ]);

  // element attributes
  addGroup(hit.type !== null, [
    entry(LockSelectionAction, {
      type: "button",
      disabled: hit.type === "nonInteractiveElement",
    }),
  ]);

  // delete
  addGroup(hit.type !== null, [
    entry(DeleteSelectionAction, { type: "button", danger: true }),
  ]);

  return items;
}
