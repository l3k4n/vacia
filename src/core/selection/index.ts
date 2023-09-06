import { CanvasElement, SelectionState, Dimensions } from "@core/types";

type SMChangeEventHandler = (selection: Readonly<SelectionState>) => void;

/** Manages all selected elements and selection highlight */
export default class SelectionManager {
  private elements: Set<CanvasElement> = new Set<CanvasElement>();
  private boxHighlight: Dimensions | null = null;
  private onChange: () => void;

  constructor(onChange: SMChangeEventHandler) {
    this.onChange = () => {
      onChange(this.getData());
    };
  }

  /** Add elements to selection */
  addElements(elements: CanvasElement[]) {
    for (let i = 0; i < elements.length; i += 1) {
      this.elements.add(elements[i]);
    }

    if (elements.length) this.onChange();
  }

  removeElements(elements: CanvasElement[]) {
    for (let i = 0; i < elements.length; i += 1) {
      this.elements.delete(elements[i]);
    }

    if (elements.length) this.onChange();
  }

  /** empties out all elements from selection */
  clearElements() {
    this.elements.clear();
    this.onChange();
  }

  // boxhighlight
  setBoxHighlight(box: Dimensions) {
    this.boxHighlight = box;
    this.onChange();
  }

  // clearing
  clearBoxHighlight() {
    this.boxHighlight = null;
    this.onChange();
  }

  getData() {
    return {
      boxHighlight: this.boxHighlight,
      elements: Array.from(this.elements),
    };
  }
}
