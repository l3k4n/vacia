import React from "react";
import { LayoutSection, ColorSection } from "./sections";
import getSelectionDetails, { SelectionProps } from "./selectionDetails";
import {
  BoundingBox,
  CanvasElement,
  CanvasElementMutations,
  ToolbarPosition,
} from "@core/types";
import { shallowDiff } from "@core/utils";
import "./style.scss";

interface DesignMenuProps {
  toolbarPosition: ToolbarPosition;
  selectedElements: CanvasElement[];
  onChange(elements: CanvasElement[], changes: CanvasElementMutations): void;
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

  onBoundingBoxChange = (box: SelectionProps["box"]) => {
    const { props: selectionProps } = this.selectionDetails;
    const elements = this.selectionElementsToApplyChangesTo;

    // get all properties that changed
    const changes = shallowDiff(box, selectionProps.box);
    const normalizedChanges = {} as Partial<BoundingBox>;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Object.keys(changes).forEach((key: keyof BoundingBox) => {
      /** cast all changes that aren't 'Mixed' to number */
      const value = changes[key];
      if (value !== "Mixed") normalizedChanges[key] = +value!;
    });
    // Note: normalizedChanges now holds all changes that can be applied
    this.props.onChange(elements, normalizedChanges);
  };

  onFillChange = (color: string) => {
    // TODO: handle fill when CanvasElement can change fill
    const elements = this.selectionElementsToApplyChangesTo;
    this.props.onChange(elements, {});
  };

  render(): React.ReactNode {
    const { metadata, props: selectionProps } = this.selectionDetails;
    return (
      <div className="DesignMenu" style={this.horizontalMenuPosition}>
        <LayoutSection
          onChange={this.onBoundingBoxChange}
          value={selectionProps.box}
        />
        <ColorSection
          onChange={this.onFillChange}
          value={selectionProps.fill}
          disabled={!metadata.canBeFilled}
        />
      </div>
    );
  }
}

export default DesignMenu;
