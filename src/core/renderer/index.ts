import drawGrid from "./drawGrid";
import { GRID_COLOR } from "@constants";
import renderElement from "@core/elements/renderer";
import { AppState, CanvasElement } from "@core/types";

interface RenderConfig {
  state: AppState;
  canvas: HTMLCanvasElement;
  scale: number;
  elements: CanvasElement[];
}

export default function renderFrame(config: RenderConfig) {
  const { canvas, state, scale, elements } = config;
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

    // apply scroll offset
    ctx.translate(
      state.scrollOffset.x / state.zoom,
      state.scrollOffset.y / state.zoom,
    );

    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 300, 150);

    for (let i = 0; i < elements.length; i += 1) {
      renderElement(ctx, elements[i]);
    }

    ctx.restore();
  });
}
