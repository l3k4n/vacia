import { TOOLBAR_POSITIONS } from "@/constants";
import "./style.scss";

interface ToolBarProps {
  options: {
    position: TOOLBAR_POSITIONS;
  };
  children: React.ReactNode;
}

const ToolBar = ({ options, children }: ToolBarProps) => (
  <div className={`ToolBar ${options.position}`} children={children} />
);
export const UtilityBar = ({ children }: React.PropsWithChildren) => (
  <div className={"UtilityBar"} children={children} />
);
export const ToolBarDivider = () => <div className="ToolBar_divider" />;

export default ToolBar;
