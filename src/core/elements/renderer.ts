import { CanvasElement, FreedrawElement, ShapeElement } from "@core/types";

function renderShapeElement(ctx: CanvasRenderingContext2D, elem: ShapeElement) {
  ctx.save();

  ctx.fillStyle = elem.styles.fill;
  if (elem.shape === "rect") {
    ctx.fillRect(elem.x, elem.y, elem.w, elem.h);
  } else {
    const rX = elem.w / 2;
    const rY = elem.h / 2;
    const cX = elem.x + rX;
    const cY = elem.y + rY;

    ctx.beginPath();
    ctx.ellipse(cX, cY, rX, rY, 0, 0, 2 * Math.PI, false);
    ctx.fill();
  }

  ctx.restore();
}

function renderFreedrawElement(
  ctx: CanvasRenderingContext2D,
  elem: FreedrawElement,
) {
  if (elem.path.length < 1) return;

  ctx.save();
  ctx.beginPath();

  const startPoint = elem.path[0];
  ctx.moveTo(startPoint[0] + elem.x, startPoint[1] + elem.y);

  for (let i = 1; i < elem.path.length; i += 1) {
    const point = elem.path[i];
    ctx.lineTo(point[0] + elem.x, point[1] + elem.y);
  }

  ctx.stroke();
  ctx.restore();
}

function renderElement(ctx: CanvasRenderingContext2D, elem: CanvasElement) {
  switch (elem.type) {
    case "shape":
      renderShapeElement(ctx, elem);
      break;
    case "freedraw":
      renderFreedrawElement(ctx, elem);
      break;
    default:
      break;
  }
}

export default renderElement;
