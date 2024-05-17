import { ELEMENT_PRECISION } from "@constants";
import { CanvasElement } from "@core/elements/types";
import { Mutable } from "@core/types";
import { assignWithoutUndefined, isInteractive } from "@core/utils";

function roundElementCoord(element: Mutable<CanvasElement>) {
  const elem = element;
  elem.x = +elem.x.toFixed(ELEMENT_PRECISION);
  elem.y = +elem.y.toFixed(ELEMENT_PRECISION);
  elem.w = +elem.w.toFixed(ELEMENT_PRECISION);
  elem.h = +elem.h.toFixed(ELEMENT_PRECISION);
}

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

  deleteElement(element: Mutable<CanvasElement>) {
    // eslint-disable-next-line
    element.deleted = true;
    this.selectedElements.delete(element);
    this.onChange();
  }

  lockElement(element: Mutable<CanvasElement>) {
    // eslint-disable-next-line
    element.locked = true;
    this.selectedElements.delete(element);
    this.onChange();
  }

  unlockElement(element: Mutable<CanvasElement>) {
    // eslint-disable-next-line
    element.locked = false;
    this.onChange();
  }

  selectElements(elements: CanvasElement[]) {
    for (let i = 0; i < elements.length; i += 1) {
      const element = elements[i];
      if(isInteractive(element)) this.selectedElements.add(element);
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

  getInteractiveElements() {
    return this.elements.filter(isInteractive);
  }

  mutateElement(element: CanvasElement, mutations: object) {
    assignWithoutUndefined(element, mutations);
    roundElementCoord(element);
    this.onChange();
  }
}
