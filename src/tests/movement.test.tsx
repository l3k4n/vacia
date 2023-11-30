import { describe, test, expect, beforeEach } from "vitest";
import { renderApp } from "./test-utils/renderApp";
import { pointerDrag, scrollWheel } from "./test-utils/simulateEvent";
import { selectTool } from "./test-utils/tools";

describe("Movement around canvas", () => {
  let canvas: HTMLCanvasElement;
  beforeEach(() => {
    canvas = renderApp().canvas as HTMLCanvasElement;
  });

  test("panning", () => {
    selectTool("Hand");
    pointerDrag(
      canvas,
      { clientX: 0, clientY: 0 },
      { clientX: 30, clientY: 30 },
    );
    expect(window.appData.state.scrollOffset).toMatchObject({ x: 30, y: 30 });
  });

  test("zooming", () => {
    scrollWheel(canvas, -2, { ctrlKey: true, clientX: 30, clientY: 30 });
    expect(window.appData.state.zoom.toFixed(2)).toBe("1.20");

    scrollWheel(canvas, 2, { ctrlKey: true, clientX: 30, clientY: 30 });
    expect(window.appData.state.zoom.toFixed(2)).toBe("1.00");
  });

  test("only pan if Hand tool is active", () => {
    selectTool("Freedraw");
    pointerDrag(
      canvas,
      { clientX: 0, clientY: 0 },
      { clientX: 69, clientY: 420 },
    );
    expect(window.appData.state.scrollOffset).toMatchObject({ x: 0, y: 0 });

    selectTool("Hand");
    pointerDrag(
      canvas,
      { clientX: 0, clientY: 0 },
      { clientX: 69, clientY: 420 },
    );
    expect(window.appData.state.scrollOffset).toMatchObject({ x: 69, y: 420 });
  });
});
