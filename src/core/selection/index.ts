import {
  CanvasElement,
  CanvasSelection,
  Dimensions,
  XYCoords,
} from "@core/types";

type SMChangeEventHandler = (selection: Readonly<CanvasSelection>) => void;
interface SMCallbacks {
  getAllElements: () => CanvasElement[];
  getAllElementsInBox: (box: Dimensions) => CanvasElement[];
  getFirstElementAtPoint: (point: XYCoords) => CanvasElement | null;
}

/** Manages all selected elements and selection highlight */
export default class SelectionManager {
  private callbacks: SMCallbacks;
  private elements: Set<CanvasElement> = new Set<CanvasElement>();
  private boxHighlight: Dimensions | null = null;
  private onChange: () => void;

  constructor(onChange: SMChangeEventHandler, callbacks: SMCallbacks) {
    this.callbacks = callbacks;
    this.onChange = () => {
      onChange({
        boxHighlight: this.boxHighlight,
        elements: Array.from(this.elements),
      });
    };
  }

  private addMultipleElements(newElements: CanvasElement[]) {
    for (let i = 0; i < newElements.length; i += 1) {
      this.elements.add(newElements[i]);
    }
  }

  // adding to selection
  /** hit test's point against all elements the and adds first hitting element
   *  to selection. returns true if an element was found at point */
  addElementAtPoint(point: XYCoords) {
    const element = this.callbacks.getFirstElementAtPoint(point);
    if (element) {
      this.elements.add(element);
      this.onChange();
      return true;
    }
    return false;
  }

  /** adds all elements within bounding box to selection. returns true
   * if an element was found in box */
  addElementsWithinBox(box: Dimensions) {
    const elements = this.callbacks.getAllElementsInBox(box);
    if (elements.length > 0) {
      this.addMultipleElements(elements);
      this.onChange();
      return true;
    }
    return false;
  }

  addAllElements() {
    const elements = this.callbacks.getAllElements();
    if (elements.length > 0) {
      this.addMultipleElements(elements);
      this.onChange();
    }
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

  /** removes all elements from selection */
  clearSelectedElements() {
    this.elements.clear();
    this.onChange();
  }

  getSelectionData() {
    return {
      boxHighlight: this.boxHighlight,
      elements: Array.from(this.elements),
    };
  }
}
