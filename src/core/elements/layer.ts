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
