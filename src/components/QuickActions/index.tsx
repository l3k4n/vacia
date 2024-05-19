import { RenderableAction } from "./types";
import { Action } from "@core/actionManager/types";
import "./style.scss";

interface Props {
  renderableActions: RenderableAction[];
  execute: (action: Action) => void;
}

export default function QuickActions(props: Props) {
  return (
    <div className="QuickActions">
      {props.renderableActions.map(({ action, Icon }, i) => (
        <button
          key={i}
          type="button"
          className="QuickActionItem"
          title={action.label}
          children={<Icon />}
          onClick={() => props.execute(action)}
        />
      ))}
    </div>
  );
}
