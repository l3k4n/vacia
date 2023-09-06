import { SelectionState, Dimensions } from "@core/types";

interface BoxOptions extends Dimensions {
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
  elements: SelectionState["elements"],
  scale: number,
) {
  if (elements.length < 1) return;

  ctx.save();

  // use first element as surrounding box to avoid zero as default values
  const surroundingBoxPoints = {
    x1: elements[0].x,
    y1: elements[0].y,
    x2: elements[0].w + elements[0].x,
    y2: elements[0].h + elements[0].y,
  };

  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2 / scale;

  for (let i = 0; i < elements.length; i += 1) {
    const { x, y, w, h } = elements[i];

    surroundingBoxPoints.x1 = Math.min(surroundingBoxPoints.x1, x);
    surroundingBoxPoints.y1 = Math.min(surroundingBoxPoints.y1, y);
    surroundingBoxPoints.x2 = Math.max(surroundingBoxPoints.x2, w + x);
    surroundingBoxPoints.y2 = Math.max(surroundingBoxPoints.y2, h + y);

    // draw individual element box
    ctx.strokeRect(x, y, w, h);
  }

  drawBoundingBoxWithHandles(ctx, {
    x: surroundingBoxPoints.x1,
    y: surroundingBoxPoints.y1,
    w: surroundingBoxPoints.x2 - surroundingBoxPoints.x1,
    h: surroundingBoxPoints.y2 - surroundingBoxPoints.y1,
    handleSize: 7,
    scale,
  });

  ctx.restore();
}
