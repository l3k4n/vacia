import { fireEvent } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { describe, test, expect } from "vitest";
import { renderApp } from "./utils";

describe("Movement around canvas", () => {
  test("panning", () => {
    const { canvas } = renderApp();

    act(() => window.appData.setState({ activeTool: "Hand" }));

    fireEvent.pointerDown(canvas, { clientX: 0, clientY: 0, buttons: 1 });
    fireEvent.pointerMove(canvas, { clientX: 30, clientY: 30 });
    fireEvent.pointerUp(canvas);

    expect(window.appData.state.scrollOffset).toMatchObject({ x: 30, y: 30 });
  });

  test("zooming", () => {
    const { canvas } = renderApp();

    fireEvent.wheel(canvas, {
      ctrlKey: true,
      clientX: 0,
      clientY: 0,
      deltaY: -125,
    });
    fireEvent.wheel(canvas, {
      ctrlKey: true,
      clientX: 0,
      clientY: 0,
      deltaY: -125,
    });
    expect(window.appData.state.zoom.toFixed(2)).toBe("1.20");

    fireEvent.wheel(canvas, {
      ctrlKey: true,
      clientX: 0,
      clientY: 0,
      deltaY: 125,
    });
    fireEvent.wheel(canvas, {
      ctrlKey: true,
      clientX: 0,
      clientY: 0,
      deltaY: 125,
    });
    expect(window.appData.state.zoom.toFixed(2)).toBe("1.00");
  });
});
