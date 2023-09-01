import { CanvasElement, FreedrawElement, ShapeElement } from "@core/types";

function renderShapeElement(ctx: CanvasRenderingContext2D, elem: ShapeElement) {
  ctx.save();

  ctx.fillStyle = "red";
  if (elem.shape === "rect") {
    ctx.fillRect(elem.x, elem.y, elem.w, elem.h);
  } else {
    let rX = elem.w / 2;
    let rY = elem.h / 2;
    let cX = elem.x + rX;
    let cY = elem.y + rY;

    // invert ellipse if radius is negative
    if (rX < 0) {
      rX = Math.abs(rX);
      cX = elem.x - rX;
    }
    if (rY < 0) {
      rY = Math.abs(rY);
      cY = elem.y - rY;
    }

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
  ctx.moveTo(startPoint[0], startPoint[1]);

  for (let i = 1; i < elem.path.length; i += 1) {
    const point = elem.path[i];
    ctx.lineTo(point[0], point[1]);
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
