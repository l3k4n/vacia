import { SelectionMetadata, SelectionProps } from "./types";
import { CanvasElement } from "@core/elements/types";
import { Mutable } from "@core/types";

export const MIXED_VALUE = Object.freeze({
  [Symbol("mixed")]: 1,
  toString: () => "Mixed",
});

function getSelectionDetails(elements: CanvasElement[]) {
  const metadata: Mutable<SelectionMetadata> = {
    selectedTypes: new Set(),
    multipleElements: elements.length > 1,
  };
  const props: Mutable<SelectionProps> = { ...elements[0] };

  props.fill = (props.fill as string).toUpperCase();

  for (let i = 0; i < elements.length; i += 1) {
    const element = elements[i];

    if (element.x !== props.x) props.x = MIXED_VALUE;
    if (element.y !== props.y) props.y = MIXED_VALUE;
    if (element.w !== props.w) props.w = MIXED_VALUE;
    if (element.h !== props.h) props.h = MIXED_VALUE;

    if (element.fill.toUpperCase() !== props.fill) props.fill = MIXED_VALUE;

    metadata.selectedTypes.add(element.type);
  }

  return { metadata, props };
}

export default getSelectionDetails;
