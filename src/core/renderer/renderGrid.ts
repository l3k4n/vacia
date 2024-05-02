import { GridData, XYCoords } from "@core/types";

interface GridOptions {
  grid: GridData;
  stroke: { color: string; size: number };
  width: number;
  height: number;
  offset: XYCoords;
}

function renderGrid(ctx: CanvasRenderingContext2D, options: GridOptions) {
  const { grid, width, height, offset, stroke } = options;

  if (grid.type === "line") {
    ctx.beginPath();
    ctx.lineWidth = stroke.size;
    for (let { x } = offset; x < width + grid.size + offset.x; x += grid.size) {
      ctx.moveTo(x, offset.y - grid.size);
      ctx.lineTo(x, height + grid.size + offset.y);
    }

    for (
      let { y } = offset;
      y < height + grid.size + offset.y;
      y += grid.size
    ) {
      ctx.moveTo(offset.x - grid.size, y);
      ctx.lineTo(width + grid.size + offset.x, y);
    }

    ctx.strokeStyle = stroke.color;
    ctx.stroke();
  }
}

export default renderGrid;
