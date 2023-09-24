import { BoundingBox, CanvasElement } from "@core/types";

export interface SelectionProps {
  box: BoundingBox;
}
export interface SelectionMetadata {
  canBeFilled: boolean;
}

interface SelectionDetails {
  metadata: SelectionMetadata;
  props: SelectionProps;
}

function getSelectionDetails(elements: CanvasElement[]): SelectionDetails {
  const metadata = { canBeFilled: false };

  const firstElement = elements[0];
  const props = {
    box: {
      x: firstElement.x,
      y: firstElement.y,
      w: firstElement.w,
      h: firstElement.h,
    },
  };

  for (let i = 0; i < elements.length; i += 1) {
    const element = elements[i];
    if (element.type === "shape") {
      metadata.canBeFilled = true;
    }
  }

  return { metadata, props };
}

export default getSelectionDetails;
