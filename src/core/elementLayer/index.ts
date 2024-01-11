import { normalizeElement } from "@core/elements/miscellaneous";
import { CanvasElement, CanvasElementMutations } from "@core/types";
import { assignWithoutUndefined } from "@core/utils";

export default class ElementLayer {
  private elements: CanvasElement[] = [];
  private selectedElements: Set<CanvasElement> = new Set<CanvasElement>();
  private onChange;

  constructor(onChange: () => void) {
    this.onChange = onChange;
  }

  addElement(element: CanvasElement) {
    this.elements.push(element);
    this.onChange();
  }

  deleteElement(element: CanvasElement) {
    const elementIndex = this.elements.indexOf(element);

    if (elementIndex > -1) {
      this.elements.splice(elementIndex, 1);
    }
    this.selectedElements.delete(element);
    this.onChange();
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
    assignWithoutUndefined(element, mutations);
    normalizeElement(element); // rounding bouding box, etc.
    this.onChange();
  }
}
