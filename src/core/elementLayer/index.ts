import { ElementHistory } from "./history";
import { ELEMENT_PRECISION } from "@constants";
import { CanvasElement } from "@core/elements/types";
import { ElementOperation } from "@core/operations/elements";
import { Mutable } from "@core/types";
import { applyElementMutations, isInteractive, arrayMove } from "@core/utils";

export default class ElementLayer {
  private elements: CanvasElement[] = [];
  private selectedElements: Set<CanvasElement> = new Set<CanvasElement>();
  private history = new ElementHistory(() => this.elements);
  private onChange;

  constructor(onChange: () => void) {
    this.onChange = onChange;
  }

  addElement(element: CanvasElement) {
    this.history.push(ElementOperation.Add.create(element));
    this.elements.push(element);
    this.onChange();
  }

  deleteElement(element: Mutable<CanvasElement>) {
    this.history.push(ElementOperation.Delete.create(element));
    // eslint-disable-next-line
    element.deleted = true;
    this.selectedElements.delete(element);
    this.onChange();
  }

  lockElement(element: Mutable<CanvasElement>) {
    this.history.push(ElementOperation.Lock.create(element));
    // eslint-disable-next-line
    element.locked = true;
    this.selectedElements.delete(element);
    this.onChange();
  }

  unlockElement(element: Mutable<CanvasElement>) {
    this.history.push(ElementOperation.Unlock.create(element));
    // eslint-disable-next-line
    element.locked = false;
    this.onChange();
  }

  moveBackWard(elements: CanvasElement[]) {
    const sortedElements = this.sortByOrder(elements);

    for (let i = 0; i < sortedElements.length; i += 1) {
      const element = sortedElements[i];
      const index = this.elements.indexOf(element);
      if (index <= 0) return;

      arrayMove(this.elements, index, index - 1);
    }

    this.onChange();
  }

  moveForward(elements: CanvasElement[]) {
    const sortedElements = this.sortByOrder(elements);

    // reverse loop to prevent shuffling
    // e.g in [0,1,2] 0 goes above 1 and 1 goes back above 0
    for (let i = sortedElements.length - 1; i >= 0; i -= 1) {
      const element = sortedElements[i];
      const index = this.elements.indexOf(element);
      if (index === -1 || index >= this.elements.length - 1) return;

      arrayMove(this.elements, index, index + 1);
    }

    this.onChange();
  }

  sendToBack(elements: CanvasElement[]) {
    const sortedElements = this.sortByOrder(elements);

    for (let i = 0, j = 0; i < sortedElements.length; i += 1, j += 1) {
      const element = sortedElements[i];
      const index = this.elements.indexOf(element);
      if (index <= j) return;

      arrayMove(this.elements, index, j);
    }

    this.onChange();
  }

  sendToFront(elements: CanvasElement[]) {
    const sortedElements = this.sortByOrder(elements);

    for (
      let i = sortedElements.length - 1, j = this.elements.length - 1;
      i >= 0;
      i -= 1, j -= 1
    ) {
      const element = sortedElements[i];
      const index = this.elements.indexOf(element);
      if (index === -1 || index >= j) return;

      arrayMove(this.elements, index, j);
    }

    this.onChange();
  }

  selectElements(elements: CanvasElement[]) {
    for (let i = 0; i < elements.length; i += 1) {
      const element = elements[i];
      if (isInteractive(element)) this.selectedElements.add(element);
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

  batchIncomingHistoryEntries(debugName?: string) {
    this.history.batchIncoming(debugName);
  }

  mergeBatchedHistoryEntries() {
    this.history.completeBatch();
  }

  undo() {
    this.history.undo();
    this.onChange();
  }

  redo() {
    this.history.redo();
    this.onChange();
  }

  sortByOrder(elements: CanvasElement[]) {
    return elements.sort(
      (a, b) => this.elements.indexOf(a) - this.elements.indexOf(b),
    );
  }

  /* completely erases all traces of element */
  dangerous_discardElement(element: Mutable<CanvasElement>) {
    this.history.discardOperationsWithElement(element);
    this.elements = this.elements.filter(
      (targetElement) => targetElement !== element,
    );
    this.selectedElements.delete(element);
    this.onChange();
  }

  mutateElement(element: CanvasElement, mutations: object) {
    this.history.push(ElementOperation.Mutate.create(element, mutations));
    applyElementMutations(element, mutations, ELEMENT_PRECISION);
    this.onChange();
  }
}
