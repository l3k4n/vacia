import { SELECTION_HANDLE_SIZE, SELECTION_PADDING } from "@constants";
import { getTransformHandles } from "@core/elements/transform";
import { BoundingBox, CanvasElement, TransformHandleData } from "@core/types";
import { getSurroundingBoundingBox } from "@core/utils";

interface BoxOptions {
  scale: number;
  box: BoundingBox;
  handleSize: number;
  handles: TransformHandleData[];
}

function drawSelectionBox(ctx: CanvasRenderingContext2D, options: BoxOptions) {
  const { handleSize, scale, box, handles } = options;
  ctx.save();

  ctx.fillStyle = "#fff";
  // broken lines around surrounding box
  ctx.setLineDash([3 / scale, 5 / scale]);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.setLineDash([0, 0]);

  handles.forEach(({ x, y, type }) => {
    ctx.beginPath();
    const size = handleSize / scale;
    if (type === "rotate") {
      ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
    } else {
      ctx.rect(x - size * 0.5, y - size * 0.5, size, size);
    }
    ctx.stroke();
    ctx.fill();
  });

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
  const padding = SELECTION_PADDING / scale;

  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2 / scale;

  /** draw bounding box for individual elements */
  for (let i = 0; i < elements.length; i += 1) {
    const { x, y, w, h, transforms } = elements[i];
    ctx.save();
    const rX = w / 2;
    const rY = h / 2;
    const radianAngle = transforms.rotate * (Math.PI / 180);
    ctx.translate(x + rX, y + rY);
    ctx.rotate(radianAngle);
    ctx.strokeRect(
      -rX - padding,
      -rY - padding,
      w + 2 * padding,
      h + 2 * padding,
    );
    ctx.restore();
  }

  const surroundingBox = getSurroundingBoundingBox(elements);
  drawSelectionBox(ctx, {
    scale,
    handles: getTransformHandles(surroundingBox, scale),
    handleSize: SELECTION_HANDLE_SIZE,
    box: {
      x: surroundingBox.x - padding,
      y: surroundingBox.y - padding,
      w: surroundingBox.w + 2 * padding,
      h: surroundingBox.h + 2 * padding,
    },
  });

  ctx.restore();
}
