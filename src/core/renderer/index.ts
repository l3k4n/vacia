import renderBoundingBoxes from "./renderBoundingBoxes";
import renderBoxHighlight from "./renderBoxHighlight";
import renderGrid from "./renderGrid";
import { GRID_COLOR } from "@constants";
import { ElementHandler } from "@core/elements/handler";
import { CanvasElement } from "@core/elements/types";
import { AppState } from "@core/types";

interface RenderConfig {
  state: AppState;
  canvas: HTMLCanvasElement;
  scale: number;
  elements: CanvasElement[];
  selectedElements: CanvasElement[];
  hideBoundingBoxes?: boolean;
  elementHandlers: Map<CanvasElement["type"], ElementHandler<CanvasElement>>;
}

export default function renderFrame(config: RenderConfig) {
  const { canvas, state, scale, elements, selectedElements } = config;
  const ctx = canvas.getContext("2d")!;
  requestAnimationFrame(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save();
    ctx.scale(scale * state.zoom, scale * state.zoom);

    renderGrid(ctx, {
      grid: state.grid,
      stroke: { color: GRID_COLOR, size: 1 / state.zoom },
      width: canvas.width / (scale * state.zoom),
      height: canvas.height / (scale * state.zoom),
      offset: {
        x: (state.scrollOffset.x / state.zoom) % state.grid.size,
        y: (state.scrollOffset.y / state.zoom) % state.grid.size,
      },
    });

    ctx.fillStyle = "#ff0000";
    ctx.font = "20px arial";
    ctx.textBaseline = "top";
    ctx.fillText(state.usermode.toUpperCase(), 0, 0);

    // apply scroll offset
    ctx.translate(
      state.scrollOffset.x / state.zoom,
      state.scrollOffset.y / state.zoom,
    );

    for (let i = 0; i < elements.length; i += 1) {
      const element = elements[i];
      const handler = config.elementHandlers.get(element.type);

      if (handler) {
        ctx.save();
        handler.render(element, ctx);
        ctx.restore();
      }
    }

    // render selection hightlight and selected element bounding boxes
    if (state.selectionHighlight) {
      renderBoxHighlight(ctx, state.selectionHighlight, state.zoom);
    }
    if (!config.hideBoundingBoxes) {
      renderBoundingBoxes(ctx, selectedElements, state.zoom);
    }

    ctx.restore();
  });
}
