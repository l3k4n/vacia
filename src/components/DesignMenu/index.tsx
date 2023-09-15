import { LayoutSection, ColorSection } from "./sections";
import "./style.scss";

interface DesignMenuProps {
  selectionConfig: {
    canBeFilled: boolean;
  };
}

export default function DesignMenu(props: DesignMenuProps) {
  return (
    <div className="DesignMenu" style={{ left: 70, top: 120 }}>
      <LayoutSection />
      <ColorSection disabled={!props.selectionConfig.canBeFilled} />
    </div>
  );
}
