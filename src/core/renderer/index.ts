import drawGrid from "./drawGrid";
import { GRID_COLOR } from "@constants";
import { AppState } from "@core/types";

interface RenderConfig {
  state: AppState;
  canvas: HTMLCanvasElement;
  scale: number;
}

// eslint-disable-next-line import/prefer-default-export
export function renderFrame(config: RenderConfig) {
  const { canvas, state, scale } = config;
  const ctx = canvas.getContext("2d")!;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.save();
  ctx.scale(scale, scale);

  const normalizedCanvasWidth = canvas.width / scale;
  const normalizedCanvasHeight = canvas.height / scale;

  drawGrid(ctx, {
    type: state.grid.type,
    width: normalizedCanvasWidth,
    height: normalizedCanvasHeight,
    gridSize: state.grid.size,
    strokeColor: GRID_COLOR,
    offset: { x: 0, y: 0 },
  });

  ctx.fillStyle = "red";
  const rectWidth = 200;
  const rectHeight = 150;
  ctx.fillRect(
    (state.width - rectWidth) / 2,
    (state.height - rectHeight) / 2,
    rectWidth,
    rectHeight,
  );
  ctx.restore();
}
