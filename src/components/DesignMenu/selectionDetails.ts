import { BoundingBox, CanvasElement } from "@core/types";

export interface SelectionProps {
  box: { [key in keyof BoundingBox]: string };
  fill: string;
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
      x: firstElement.x.toString(),
      y: firstElement.y.toString(),
      w: firstElement.w.toString(),
      h: firstElement.h.toString(),
    },
    fill: firstElement.styles.fill.toUpperCase(),
  };

  for (let i = 0; i < elements.length; i += 1) {
    const element = elements[i];

    // bounding box
    if (element.x.toString() !== props.box.x) props.box.x = "Mixed";
    if (element.y.toString() !== props.box.y) props.box.y = "Mixed";
    if (element.w.toString() !== props.box.w) props.box.w = "Mixed";
    if (element.h.toString() !== props.box.h) props.box.h = "Mixed";

    if (element.styles.fill.toUpperCase() !== props.fill) props.fill = "Mixed";

    if (element.type === "shape") {
      metadata.canBeFilled = true;
    }
  }

  return { metadata, props };
}

export default getSelectionDetails;
