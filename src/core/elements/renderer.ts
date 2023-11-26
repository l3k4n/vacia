import { CanvasElement, FreedrawElement, ShapeElement } from "@core/types";

function renderShapeElement(ctx: CanvasRenderingContext2D, elem: ShapeElement) {
  ctx.save();

  const rX = elem.w / 2;
  const rY = elem.h / 2;
  ctx.translate(elem.x + rX, elem.y + rY);
  ctx.rotate(elem.rotate);

  ctx.fillStyle = elem.fill;
  if (elem.shape === "rect") {
    ctx.fillRect(-rX, -rY, elem.w, elem.h);
  } else {
    ctx.beginPath();
    ctx.ellipse(0, 0, rX, rY, 0, 0, 2 * Math.PI, false);
    ctx.fill();
  }

  ctx.restore();
}

function renderFreedrawElement(
  ctx: CanvasRenderingContext2D,
  elem: FreedrawElement,
) {
  if (elem.path.length < 1) return;
  const rX = elem.w / 2;
  const rY = elem.h / 2;

  ctx.save();
  ctx.translate(elem.x + rX, elem.y + rY);
  ctx.rotate(elem.rotate);
  ctx.beginPath();

  const startPoint = elem.path[0];
  ctx.moveTo(startPoint[0] - rX, startPoint[1] - rY);

  for (let i = 1; i < elem.path.length; i += 1) {
    const point = elem.path[i];
    ctx.lineTo(point[0] - rX, point[1] - rY);
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
