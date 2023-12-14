import { BoundingBox, CanvasElement } from "@core/types";

export const MIXED_VALUE = Object.freeze({
  [Symbol("mixed")]: 1,
  toString: () => "Mixed",
});
export type Mixed<T> = { [K in keyof T]: T[K] | typeof MIXED_VALUE };

export type SelectionProps = Mixed<BoundingBox & { fill: string }>;
export interface SelectionMetadata {
  canBeFilled: boolean;
}

function getSelectionDetails(elements: CanvasElement[]) {
  const metadata = { canBeFilled: false };

  const props: SelectionProps = { ...elements[0] };
  props.fill = (props.fill as string).toUpperCase();

  for (let i = 0; i < elements.length; i += 1) {
    const element = elements[i];

    if (element.x !== props.x) props.x = MIXED_VALUE;
    if (element.y !== props.y) props.y = MIXED_VALUE;
    if (element.w !== props.w) props.w = MIXED_VALUE;
    if (element.h !== props.h) props.h = MIXED_VALUE;

    if (element.fill.toUpperCase() !== props.fill) props.fill = MIXED_VALUE;

    if (element.type === "shape") {
      metadata.canBeFilled = true;
    }
  }

  return { metadata, props };
}

export default getSelectionDetails;
