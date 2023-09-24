import React from "react";
import { LayoutSection, ColorSection } from "./sections";
import getSelectionDetails from "./selectionDetails";
import { CanvasElement, ToolbarPosition } from "@core/types";
import "./style.scss";

interface DesignMenuProps {
  toolbarPosition: ToolbarPosition;
  selectedElements: CanvasElement[];
}

class DesignMenu extends React.Component<DesignMenuProps> {
  /** styles to change menu position based on the toolbar's position */
  horizontalMenuPosition;
  /** Metadata and shared properties of the current selection. */
  selectionDetails;
  /** Selection might change before it is updated, so this property keeps track
   * of the selection prior to the most recent rerender */
  selectionElementsToApplyChangesTo;

  constructor(props: DesignMenuProps) {
    super(props);
    this.selectionElementsToApplyChangesTo = props.selectedElements;
    this.selectionDetails = getSelectionDetails(props.selectedElements);
    /** put the menu next to the toolbar if at the left or right
     * otherwise put it on the left */
    this.horizontalMenuPosition =
      props.toolbarPosition === "right" || props.toolbarPosition === "left"
        ? { [props.toolbarPosition]: 70 }
        : { left: 10 };
  }

  componentDidUpdate(prevProps: DesignMenuProps) {
    if (prevProps.selectedElements !== this.props.selectedElements) {
      this.selectionDetails = getSelectionDetails(this.props.selectedElements);
      /** selection changed so keep track of the previous one */
      this.selectionElementsToApplyChangesTo = prevProps.selectedElements;
    } else {
      /** selection did not change so use the current one */
      this.selectionElementsToApplyChangesTo = this.props.selectedElements;
    }
  }

  render(): React.ReactNode {
    const { metadata, sharedProperties } = this.selectionDetails;
    return (
      <div className="DesignMenu" style={this.horizontalMenuPosition}>
        <LayoutSection onChange={() => null} value={sharedProperties.box} />
        <ColorSection
          onChange={() => null}
          value={"red"}
          disabled={!metadata.canBeFilled}
        />
      </div>
    );
  }
}

export default DesignMenu;
