import { SELECTION_BOX_PADDING } from "@constants";
import { BoundingBox, CanvasElement } from "@core/types";
import { getSurroundingBoundingBox } from "@core/utils";

interface BoxOptions extends BoundingBox {
  scale: number;
  handleSize: number;
}

function drawBoundingBoxWithHandles(
  ctx: CanvasRenderingContext2D,
  { x, y, w, h, scale, handleSize }: BoxOptions,
) {
  ctx.save();
  const drawHandle = (xPos: number, yPos: number) => {
    ctx.beginPath();
    ctx.rect(
      xPos - handleSize / (2 * scale),
      yPos - handleSize / (2 * scale),
      handleSize / scale,
      handleSize / scale,
    );
    ctx.stroke();
    ctx.fill();
  };

  // broken lines around surrounding box
  ctx.setLineDash([3 / scale, 5 / scale]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([0, 0]);

  ctx.fillStyle = "#fff";

  drawHandle(x, y);
  drawHandle(x + w, y);
  drawHandle(x, y + h);
  drawHandle(x + w, y + h);

  ctx.restore();
}

export default function renderBoundingBoxes(
  ctx: CanvasRenderingContext2D,
  elements: CanvasElement[],
  scale: number,
) {
  if (elements.length < 1) return;

  ctx.save();

  /** padding around selected content */
  const padding = SELECTION_BOX_PADDING / scale;

  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2 / scale;

  /** draw bounding box for individual elements */
  for (let i = 0; i < elements.length; i += 1) {
    const { x, y, w, h } = elements[i];
    ctx.strokeRect(x - padding, y - padding, w + 2 * padding, h + 2 * padding);
  }

  const surroundingBox = getSurroundingBoundingBox(elements);
  drawBoundingBoxWithHandles(ctx, {
    /** bounding box of all selected elements */
    x: surroundingBox.x - padding,
    y: surroundingBox.y - padding,
    w: surroundingBox.w + 2 * padding,
    h: surroundingBox.h + 2 * padding,
    handleSize: 7,
    scale,
  });

  ctx.restore();
}
