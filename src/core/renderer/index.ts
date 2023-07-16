interface RenderConfig {
  state: { width: number; height: number };
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
