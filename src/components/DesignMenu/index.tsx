import React, { CSSProperties } from "react";
import { LayoutSection, ColorSection } from "./sections";
import getSelectionDetails, {
  SelectionMetadata,
  SelectionProps,
} from "./selectionDetails";
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

interface DesignMenuState {
  elements: CanvasElement[];
  /** Stores shared properties of the current selection or a `Mixed`. */
  selectionProps: SelectionProps;
  /** Stores additional information about the selection, describing its
   * properties. E.g, whether fill can be applied to the selected elements */
  selectionMetadata: SelectionMetadata;
  /** styles to change menu position based on the toolbar's position */
  positionStyles: CSSProperties;
}

class DesignMenu extends React.Component<DesignMenuProps, DesignMenuState> {
  /** timeout id of the last deferred state change */
  pendingTimeout: number | null = null;

  constructor(props: DesignMenuProps) {
    super(props);

    const selectionDetails = getSelectionDetails(props.selectedElements);
    this.state = {
      elements: props.selectedElements,
      selectionProps: selectionDetails.props,
      selectionMetadata: selectionDetails.metadata,
      positionStyles:
        props.toolbarPosition === "right" || props.toolbarPosition === "left"
          ? { [props.toolbarPosition]: 70 }
          : { left: 10 },
    };
  }

  componentDidUpdate(prevProps: Readonly<DesignMenuProps>): void {
    if (prevProps.selectedElements !== this.props.selectedElements) {
      if (this.pendingTimeout !== null) {
        window.clearTimeout(this.pendingTimeout);
      }

      /** defer updating state because `MenuSections` might need to push their
       * changes to the current selection */
      this.pendingTimeout = window.setTimeout(() => {
        const selectionDetails = getSelectionDetails(
          this.props.selectedElements,
        );
        this.setState({
          elements: this.props.selectedElements,
          selectionProps: selectionDetails.props,
          selectionMetadata: selectionDetails.metadata,
        });
      }, 0);
    }
  }

  onBoundingBoxChange = (box: SelectionProps["box"]) => {
    const { selectionProps, elements } = this.state;
    // const elements = this.props.selectedElements;

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
    const { elements } = this.state;
    this.props.onChange(elements, { fill: color });
  };

  render(): React.ReactNode {
    const { selectionMetadata, selectionProps } = this.state;
    return (
      <div className="DesignMenu" style={this.state.positionStyles}>
        <LayoutSection
          onChange={this.onBoundingBoxChange}
          value={selectionProps.box}
        />
        <ColorSection
          onChange={this.onFillChange}
          value={selectionProps.fill}
          disabled={!selectionMetadata.canBeFilled}
        />
      </div>
    );
  }
}

export default DesignMenu;
