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

  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2 / scale;

  /** draw bounding box for individual elements */
  for (let i = 0; i < elements.length; i += 1) {
    const { x, y, w, h } = elements[i];
    ctx.strokeRect(x, y, w, h);
  }

  drawBoundingBoxWithHandles(ctx, {
    /** bounding box of all selected elements */
    ...getSurroundingBoundingBox(elements),
    handleSize: 7,
    scale,
  });

  ctx.restore();
}
