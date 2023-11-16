import ApplyElementSpecificMutation from "@core/elements/mutate";
import {
  CanvasElement,
  CanvasElementMutations,
  TransformingElement,
} from "@core/types";

export interface ElementLayerChangeEvent {
  elements: CanvasElement[];
  selectedElements: CanvasElement[];
}

export default class ElementLayer {
  private elements: CanvasElement[] = [];
  private selectedElements: Set<CanvasElement> = new Set<CanvasElement>();
  private creatingElement: CanvasElement | null = null;
  private draggingElements: CanvasElement[] = [];
  private transformingElements: TransformingElement[] = [];
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
    if (element === this.creatingElement) {
      this.creatingElement = null;
    }
    this.selectedElements.delete(element);
    this.onChange();
  }

  /** adds an new element and keeps a ref to it (i.e can be used to keep track
   * of elements that should be persisted even if pointer is cleared) */
  addCreatingElement(element: CanvasElement) {
    this.elements.push(element);
    this.selectedElements.clear();
    this.selectedElements.add(element);
    this.creatingElement = element;

    this.onChange();
    return element;
  }

  getCreatingElement() {
    return this.creatingElement;
  }

  /** removes all internal refs to the element being created */
  clearCreatingElement() {
    this.creatingElement = null;
  }

  /** stores an array of elements being dragged */
  setDraggingElements(elements: CanvasElement[]) {
    this.draggingElements = elements;
  }

  getDraggingElements() {
    return this.draggingElements;
  }

  /** Empties the array of elements being dragged, indicating that no
   * elements are currently being dragged. */
  clearDraggingElements() {
    this.draggingElements = [];
  }

  setTransformingElements(elements: CanvasElement[]) {
    elements.forEach((element) => {
      this.transformingElements.push({
        element,
        initialBox: {
          x: element.x,
          y: element.y,
          w: element.w,
          h: element.h,
          rotate: element.transforms.rotate,
        },
      });
    });
  }

  getTransformingElements() {
    return this.transformingElements;
  }

  clearTransformingElements() {
    this.transformingElements.length = 0;
  }

  selectElements(elements: CanvasElement[]) {
    for (let i = 0; i < elements.length; i += 1) {
      this.selectedElements.add(elements[i]);
    }

    this.onChange();
  }

  unselectElements(elements: CanvasElement[]) {
    for (let i = 0; i < elements.length; i += 1) {
      this.selectedElements.delete(elements[i]);
    }
    this.onChange();
  }

  unselectAllElements() {
    this.selectedElements.clear();
    this.onChange();
  }

  getSelectedElements() {
    return Array.from(this.selectedElements);
  }

  getAllElements() {
    return this.elements;
  }

  mutateElement(element: CanvasElement, mutations: CanvasElementMutations) {
    ApplyElementSpecificMutation(element, mutations);
    this.onChange();
  }
}
