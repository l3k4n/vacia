/* eslint-disable no-param-reassign, no-use-before-define */

import { ELEMENT_PRECISION } from "@constants";
import { CanvasElement } from "@core/elements/types";
import { Mutable } from "@core/types";
import { applyElementMutations, arrayMove } from "@core/utils";

export const enum OperationType {
  ADD,
  DELETE,
  LOCK,
  UNLOCK,
  MUTATE,
  ORDER,
  BATCHED,
}

type OperationElement = Mutable<CanvasElement>;
export type OrderedElement = {
  element: OperationElement;
  prev: number;
  next: number;
};

interface AddOperation {
  type: OperationType.ADD;
  element: OperationElement;
}
interface LockOperation {
  type: OperationType.LOCK;
  element: OperationElement;
}
interface UnlockOperation {
  type: OperationType.UNLOCK;
  element: OperationElement;
}
interface DeleteOperation {
  type: OperationType.DELETE;
  element: OperationElement;
}
interface OrderOperation {
  type: OperationType.ORDER;
  elements: OrderedElement[];
}
interface MutateOperation {
  type: OperationType.MUTATE;
  element: OperationElement;
  prevMutation: object;
  nextMutation: object;
}

export type AtomicOperation =
  | AddOperation
  | LockOperation
  | UnlockOperation
  | DeleteOperation
  | OrderOperation
  | MutateOperation;

export interface BatchOperation {
  debugName?: string;
  type: OperationType.BATCHED;
  entries: AtomicOperation[];
}

const Add = {
  create(element: CanvasElement): AddOperation {
    return { type: OperationType.ADD, element };
  },
  perform: (elements: CanvasElement[], op: AddOperation) => {
    elements.push(op.element);
  },
  revert: (elements: CanvasElement[], _: AddOperation) => {
    elements.pop()!;
  },
  merge(current: AddOperation, next: AtomicOperation): boolean {
    if (next.type !== OperationType.MUTATE) return false;
    if (current.element !== next.element) return false;
    // a MutateOperation is the only operation allowed to merge into AddOperaion
    // E.g adding a element then moving to the left, can be merged into just
    // adding the element on the left
    return true;
  },
};

const Lock = {
  create(element: CanvasElement): LockOperation {
    return { type: OperationType.LOCK, element };
  },
  perform: (_: CanvasElement[], op: LockOperation) => {
    op.element.locked = true;
  },
  revert: (_: CanvasElement[], op: LockOperation) => {
    op.element.locked = false;
  },
  merge(_: LockOperation, __: AtomicOperation): boolean {
    // no operation can be merged with a lock
    return false;
  },
};

const Unlock = {
  create(element: CanvasElement): UnlockOperation {
    return { type: OperationType.UNLOCK, element };
  },
  perform: (_: CanvasElement[], op: UnlockOperation) => {
    op.element.locked = false;
  },
  revert: (_: CanvasElement[], op: UnlockOperation) => {
    op.element.locked = true;
  },
  merge(_: UnlockOperation, __: AtomicOperation): boolean {
    // no operation can be merged with an unlock
    return false;
  },
};

const Delete = {
  create(element: CanvasElement): DeleteOperation {
    return { type: OperationType.DELETE, element };
  },
  perform: (_: CanvasElement[], op: DeleteOperation) => {
    op.element.deleted = true;
  },
  revert: (_: CanvasElement[], op: DeleteOperation) => {
    op.element.deleted = false;
  },
  merge(_: DeleteOperation, __: AtomicOperation): boolean {
    // no operation can be merged with a delete
    return false;
  },
};

const Order = {
  create(elements: OrderedElement[]): OrderOperation {
    return { type: OperationType.ORDER, elements };
  },
  perform: (elements: CanvasElement[], op: OrderOperation) => {
    for (let i = 0; i < op.elements.length; i += 1) {
      const element = op.elements[i];
      arrayMove(elements, element.prev, element.next);
    }
  },
  revert: (elements: CanvasElement[], op: OrderOperation) => {
    for (let i = op.elements.length - 1; i >= 0; i -= 1) {
      const element = op.elements[i];
      arrayMove(elements, element.next, element.prev);
    }
  },
  merge(first: OrderOperation, second: AtomicOperation): boolean {
    if (second.type !== OperationType.ORDER) return false;

    first.elements.push(...second.elements);
    return true;
  },
};

const Mutate = {
  create(element: CanvasElement, mutations: object): MutateOperation {
    const prevMutation: Record<string, unknown> = {};
    const nextMutation: Record<string, unknown> = {};

    const keys = Object.keys(mutations);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i] as keyof object;

      if (element[key] === mutations[key]) continue;
      prevMutation[key] = element[key];
      nextMutation[key] = mutations[key];
    }

    return { type: OperationType.MUTATE, element, prevMutation, nextMutation };
  },
  perform: (_: CanvasElement[], { element, nextMutation }: MutateOperation) => {
    applyElementMutations(element, nextMutation, ELEMENT_PRECISION);
  },
  revert: (_: CanvasElement[], { element, prevMutation }: MutateOperation) => {
    applyElementMutations(element, prevMutation, ELEMENT_PRECISION);
  },
  merge(current: MutateOperation, next: AtomicOperation): boolean {
    // MutateOperation can only be merged with other MutateOperation's
    if (next.type !== OperationType.MUTATE) return false;
    if (current.element !== next.element) return false;

    // merge all mutations into 'nextMutation'
    Object.assign(current.nextMutation, next.nextMutation);

    const keys = Object.keys(next.prevMutation);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i] as keyof CanvasElement;
      // only merge new properies to 'prevMutation'
      if (Object.hasOwn(current.prevMutation, key)) continue;
      // @ts-ignore
      current.prevMutation[key] = next.prevMutation[key];
    }

    return true;
  },
};

const Batched = {
  create(debugName?: string): BatchOperation {
    return { type: OperationType.BATCHED, entries: [], debugName };
  },
  perform(elements: CanvasElement[], op: BatchOperation) {
    op.entries.forEach((operation) => performOperation(elements, operation));
  },
  revert(elements: CanvasElement[], op: BatchOperation) {
    op.entries.forEach((operation) => revertOperation(elements, operation));
  },
  normalize(op: BatchOperation) {
    if (op.entries.length === 0) return null;
    if (op.entries.length === 1) return op.entries[0];
    return op;
  },
  merge(current: BatchOperation, next: AtomicOperation): boolean {
    if (
      !current.entries.length ||
      !mergeOperation(current.entries[current.entries.length - 1], next)
    ) {
      current.entries.push(next);
    }

    // since we either successfully merge or push into entries,
    // merge will always be successful
    return true;
  },
};

function performOperation(
  elements: CanvasElement[],
  op: AtomicOperation | BatchOperation,
): void {
  switch (op.type) {
    case OperationType.ADD:
      return Add.perform(elements, op);
    case OperationType.MUTATE:
      return Mutate.perform(elements, op);
    case OperationType.DELETE:
      return Delete.perform(elements, op);
    case OperationType.LOCK:
      return Lock.perform(elements, op);
    case OperationType.UNLOCK:
      return Unlock.perform(elements, op);
    case OperationType.ORDER:
      return Order.perform(elements, op);
    case OperationType.BATCHED:
      return op.entries.forEach((operation) =>
        performOperation(elements, operation),
      );
    default:
      return undefined;
  }
}

function revertOperation(
  elements: CanvasElement[],
  op: AtomicOperation | BatchOperation,
): void {
  switch (op.type) {
    case OperationType.ADD:
      return Add.revert(elements, op);
    case OperationType.MUTATE:
      return Mutate.revert(elements, op);
    case OperationType.DELETE:
      return Delete.revert(elements, op);
    case OperationType.LOCK:
      return Lock.revert(elements, op);
    case OperationType.UNLOCK:
      return Unlock.revert(elements, op);
    case OperationType.ORDER:
      return Order.revert(elements, op);
    case OperationType.BATCHED:
      return op.entries.forEach((operation) =>
        revertOperation(elements, operation),
      );
    default:
      return undefined;
  }
}

function mergeOperation(
  first: AtomicOperation | BatchOperation,
  second: AtomicOperation,
): boolean {
  switch (first.type) {
    case OperationType.ADD:
      return Add.merge(first, second);
    case OperationType.MUTATE:
      return Mutate.merge(first, second);
    case OperationType.DELETE:
      return Delete.merge(first, second);
    case OperationType.LOCK:
      return Lock.merge(first, second);
    case OperationType.UNLOCK:
      return Unlock.merge(first, second);
    case OperationType.ORDER:
      return Order.merge(first, second);
    case OperationType.BATCHED:
      return Batched.merge(first, second);
    default:
      return false;
  }
}

export const perform = performOperation;
export const revert = revertOperation;
export const merge = mergeOperation;
export const ElementOperation = {
  Batched,
  Add,
  Mutate,
  Lock,
  Unlock,
  Delete,
  Order,
};
