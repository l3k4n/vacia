import ApplyElementSpecificMutation from "@core/elements/mutate";
import { CanvasElement, CanvasElementMutations } from "@core/types";

export interface ElementLayerChangeEvent {
  elements: CanvasElement[];
  selectedElements: CanvasElement[];
}

export default class ElementLayer {
  private elements: CanvasElement[] = [];
  private selectedElements: Set<CanvasElement> = new Set<CanvasElement>();
  private elementBeingCreated: CanvasElement | null = null;
  private elementsBeingDragged: CanvasElement[] = [];
  private onChange;

  constructor(onChange: (ev: ElementLayerChangeEvent) => void) {
    this.onChange = () => {
      onChange({
        elements: this.getAllElements(),
        selectedElements: this.getSelectedElements(),
      });
    };
  }

  deleteElement(element: CanvasElement) {
    const elementIndex = this.elements.indexOf(element);

    if (elementIndex > -1) {
      this.elements.splice(elementIndex, 1);
    }
    if (element === this.elementBeingCreated) {
      this.elementBeingCreated = null;
    }
    this.selectedElements.delete(element);
    this.onChange();
  }

  getAllElements() {
    return this.elements;
  }

  /** keeps a ref to a single element which is still being drawn
   * (e.g when drawing with free draw) */
  addElementBeingCreated(element: CanvasElement) {
    this.elements.push(element);
    this.selectedElements.clear();
    this.selectedElements.add(element);
    this.elementBeingCreated = element;

    this.onChange();
    return element;
  }

  /** stores an array of elements being dragged */
  setElementsBeingDragged(elements: CanvasElement[]) {
    this.elementsBeingDragged = elements;
  }

  getElementsBeingDragged() {
    return this.elementsBeingDragged;
  }

  /** Empties the array of elements being dragged, indicating that no
   * elements are currently being dragged. */
  clearElementsBeingDragged() {
    this.elementsBeingDragged = [];
  }

  getElementBeingCreated() {
    return this.elementBeingCreated;
  }

  /** removes all internal refs to the element being created */
  finishCreatingElement() {
    this.elementBeingCreated = null;
  }

  selectElements(elements: CanvasElement[]) {
    for (let i = 0; i < elements.length; i += 1) {
      this.selectedElements.add(elements[i]);
    }

    this.onChange();
  }

  unSelectElements(elements: CanvasElement[]) {
    for (let i = 0; i < elements.length; i += 1) {
      this.selectedElements.delete(elements[i]);
    }
    this.onChange();
  }

  unSelectAllElements() {
    this.selectedElements.clear();
    this.onChange();
  }

  getSelectedElements() {
    return Array.from(this.selectedElements);
  }

  mutateElement(element: CanvasElement, mutations: CanvasElementMutations) {
    ApplyElementSpecificMutation(element, mutations);
    this.onChange();
  }
}
