import { LayoutSection, ColorSection } from "./sections";
import { ToolbarPosition } from "@core/types";
import "./style.scss";

interface DesignMenuProps {
  toolbarPosition: ToolbarPosition;
  selectionConfig: {
    canBeFilled: boolean;
  };
}

export default function DesignMenu(props: DesignMenuProps) {
  let horizontalMenuPosition;

  /** put the menu next to the toolbar if at the left or right
   * otherwise put it on the left */
  if (props.toolbarPosition === "right" || props.toolbarPosition === "left") {
    horizontalMenuPosition = { [props.toolbarPosition]: 70 };
  } else {
    horizontalMenuPosition = { left: 10 };
  }

  return (
    <div className="DesignMenu" style={horizontalMenuPosition}>
      <LayoutSection />
      <ColorSection disabled={!props.selectionConfig.canBeFilled} />
    </div>
  );
}
