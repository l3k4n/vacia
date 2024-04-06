import ToolButton from "@components/ToolButton";
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
    <div className="QuickActionsIsland">
      {props.actions.map((action, i) => (
        <ToolButton
          key={i}
          type="button"
          children={<action.icon />}
          label={action.label}
          onClick={() => props.actionManager.execute(action.id)}
        />
      ))}
    </div>
  );
}
