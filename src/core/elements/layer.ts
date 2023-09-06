import { CanvasElement } from "@core/types";

export default class ElementLayer {
  private elements: CanvasElement[] = [];
  private elementBeingCreated: CanvasElement | null = null;

  addElement(element: CanvasElement, config?: { isBeingCreated?: true }) {
    this.elements.push(element);

    if (config?.isBeingCreated) {
      this.elementBeingCreated = element;
    }
  }

  deleteElement(element: CanvasElement) {
    const elementIndex = this.elements.indexOf(element);

    if (elementIndex > -1) {
      this.elements.splice(elementIndex, 1);
    }
    if (element === this.elementBeingCreated) {
      this.elementBeingCreated = null;
    }
  }

  getAllElements() {
    return this.elements;
  }

  getElementBeingCreated() {
    return this.elementBeingCreated;
  }

  /** removes the ref to the element being created */
  finalizeElementCreation() {
    this.elementBeingCreated = null;
  }
}
