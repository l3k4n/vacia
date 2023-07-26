import { AppState } from "@core/types";

interface GridOptions {
  width: number;
  height: number;
  type: AppState["grid"]["type"];
  strokeColor: string;
  gridSize: number;
  offset: { x: number; y: number };
}

function drawGrid(ctx: CanvasRenderingContext2D, options: GridOptions) {
  const { type, width, height, gridSize, strokeColor, offset } = options;
  if (type === "line") {
    ctx.beginPath();

    for (let { x } = offset; x < width + gridSize + offset.x; x += gridSize) {
      ctx.moveTo(x, offset.y - gridSize);
      ctx.lineTo(x, height + gridSize + offset.y);
    }

    for (let { y } = offset; y < height + gridSize + offset.y; y += gridSize) {
      ctx.moveTo(offset.x - gridSize, y);
      ctx.lineTo(width + gridSize + offset.x, y);
    }

    ctx.strokeStyle = strokeColor;
    ctx.stroke();
  }
}

export default drawGrid;
