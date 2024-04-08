import { ActionManager } from "@core/actionManager";
import "./style.scss";

export interface QuickActionType {
  id: string;
  label: string;
  icon: React.FC;
}

interface Props {
  actions: QuickActionType[];
  actionManager: ActionManager;
}

export default function QuickActions(props: Props) {
  return (
    <div className="QuickActions">
      {props.actions.map((action, i) => (
        <button
          key={i}
          type="button"
          className="QuickActionItem"
          title={action.label}
          children={<action.icon />}
          onClick={() => props.actionManager.execute(action.id)}
        />
      ))}
    </div>
  );
}
