import { SELECTION_HANDLE_SIZE, SELECTION_LINE_DASH_SIZE } from "@constants";
import { getTransformHandles } from "@core/elements/transform";
import { BoundingBox, CanvasElement, TransformHandle } from "@core/types";
import { getSurroundingBoundingBox } from "@core/utils";

function drawSurroundingBox(
  ctx: CanvasRenderingContext2D,
  box: BoundingBox,
  dashSize: number,
) {
  ctx.save();
  ctx.setLineDash([dashSize, dashSize]);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.setLineDash([0, 0]);
  ctx.restore();
}

function drawSelectionHandles(
  ctx: CanvasRenderingContext2D,
  handles: TransformHandle[],
  size: number,
) {
  handles.forEach(({ x, y, type }) => {
    ctx.beginPath();

    if (type === "rotate") {
      ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
    } else {
      ctx.rect(x - size * 0.5, y - size * 0.5, size, size);
    }
    ctx.stroke();
    ctx.fill();
  });
}

export default function renderBoundingBoxes(
  ctx: CanvasRenderingContext2D,
  elements: CanvasElement[],
  scale: number,
) {
  if (elements.length < 1) return;

  ctx.save();

  ctx.lineWidth = 2 / scale;
  ctx.strokeStyle = "blue";
  ctx.fillStyle = "#fff";

  const lineDashSize = SELECTION_LINE_DASH_SIZE / scale;
  const handleSize = SELECTION_HANDLE_SIZE / scale;

  /** draw bounding box for individual elements */
  for (let i = 0; i < elements.length; i += 1) {
    const { x, y, w, h, rotate } = elements[i];
    ctx.save();
    const rX = w / 2;
    const rY = h / 2;
    ctx.translate(x + rX, y + rY);
    ctx.rotate(rotate);
    ctx.strokeRect(-rX, -rY, w, h);
    ctx.restore();
  }

  const surroundingBox = getSurroundingBoundingBox(elements);
  const transformHandles = getTransformHandles(surroundingBox, scale);

  if (elements.length > 1) {
    drawSurroundingBox(ctx, surroundingBox, lineDashSize);
  }
  drawSelectionHandles(ctx, transformHandles, handleSize);

  ctx.restore();
}
