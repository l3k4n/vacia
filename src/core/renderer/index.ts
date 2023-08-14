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
  requestAnimationFrame(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save();
    ctx.scale(scale * state.zoom, scale * state.zoom);

    const normalizedCanvasWidth = canvas.width / scale;
    const normalizedCanvasHeight = canvas.height / scale;

    drawGrid(ctx, {
      type: state.grid.type,
      width: normalizedCanvasWidth / state.zoom,
      height: normalizedCanvasHeight / state.zoom,
      gridSize: state.grid.size,
      strokeColor: GRID_COLOR,
      offset: {
        x: (state.scrollOffset.x / state.zoom) % state.grid.size,
        y: (state.scrollOffset.y / state.zoom) % state.grid.size,
      },
    });

    ctx.fillStyle = "red";
    const rectWidth = 200;
    const rectHeight = 150;
    ctx.fillRect(
      state.scrollOffset.x / state.zoom,
      state.scrollOffset.y / state.zoom,
      rectWidth,
      rectHeight,
    );
    ctx.restore();
  });
}
