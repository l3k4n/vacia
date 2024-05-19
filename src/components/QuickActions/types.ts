import { Action } from "@core/actionManager/types";

export interface RenderableAction {
  Icon: React.FC;
  action: Action;
}
