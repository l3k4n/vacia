import React, { CSSProperties } from "react";
import { LayoutSection, ColorSection } from "./sections";
import getSelectionDetails, {
  MIXED_VALUE,
  SelectionMetadata,
  SelectionProps,
} from "./selectionDetails";
import {
  CanvasElement,
  CanvasElementMutations,
  ToolbarPosition,
} from "@core/types";
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

      /** defer updating state because some events (e.g onblur) will occur after
       * state change otherwise */
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

  onChange = (changes: Partial<SelectionProps>) => {
    const changesToApply: Partial<Record<keyof SelectionProps, unknown>> = {};
    const keys = Object.keys(changes) as (keyof SelectionProps)[];
    let shouldApplyChanges = false;

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const value = changes[key];
      const previousValue = this.state.selectionProps[key];

      if (value !== MIXED_VALUE && value !== previousValue) {
        changesToApply[key] = changes[key];
        shouldApplyChanges = true;
      }
    }

    if (shouldApplyChanges) {
      this.props.onChange(this.state.elements, changesToApply);
    }
  };

  render(): React.ReactNode {
    const { selectionMetadata, selectionProps } = this.state;
    return (
      <div className="DesignMenu" style={this.state.positionStyles}>
        <LayoutSection onChange={this.onChange} value={selectionProps} />
        <ColorSection
          onChange={this.onChange}
          value={selectionProps}
          disabled={!selectionMetadata.canBeFilled}
        />
      </div>
    );
  }
}

export default DesignMenu;
