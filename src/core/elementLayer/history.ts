import { CanvasElement } from "@core/elements/types";
import {
  AtomicOperation,
  BatchOperation,
  ElementOperation,
  merge,
  perform,
  revert,
} from "@core/operations/elements";

export class ElementHistory {
  private undoStack: (AtomicOperation | BatchOperation)[] = [];
  private redoStack: (AtomicOperation | BatchOperation)[] = [];
  private batchOperation: BatchOperation | null = null;
  private elements: () => CanvasElement[];

  constructor(elements: () => CanvasElement[]) {
    this.elements = elements;
  }

  push(op: AtomicOperation) {
    if (this.batchOperation) {
      merge(this.batchOperation, op);
      return;
    }

    this.undoStack.push(op);
    this.redoStack.length = 0;
  }

  redo() {
    this.discardBatched();
    if (!this.redoStack.length) return;

    const entry = this.redoStack.pop()!;
    this.undoStack.push(entry);

    perform(this.elements(), entry);
  }

  undo() {
    this.discardBatched();
    if (!this.undoStack.length) return;

    const entry = this.undoStack.pop()!;
    this.redoStack.push(entry);

    revert(this.elements(), entry);
  }

  batchIncoming(debugName?: string) {
    if (this.batchOperation) this.completeBatch();
    this.batchOperation = ElementOperation.Batched.create(debugName);
  }

  completeBatch() {
    if (!this.batchOperation) return;

    const normalized = ElementOperation.Batched.normalize(this.batchOperation);
    if (normalized) this.undoStack.push(normalized);

    this.discardBatched();
  }

  discardBatched() {
    this.batchOperation = null;
  }
}
