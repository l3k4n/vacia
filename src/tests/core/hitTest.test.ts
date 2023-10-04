import { describe, test, expect, beforeEach } from "vitest";

import { createShapeElement } from "@core/elements";
import {
  hitTestElementAgainstBox,
  hitTestCoordsAgainstElement,
} from "@core/hitTest";
import { ShapeElement } from "@core/types";

describe("hitTestShape", () => {
  let element: ShapeElement;

  beforeEach(() => {
    element = createShapeElement({
      shape: "ellipse",
      x: 0,
      y: 0,
      w: 20,
      h: 20,
    });
  });

  test("point within shape", () => {
    const coords = { x: 5, y: 5 };
    expect(hitTestCoordsAgainstElement(element, coords)).toBe(true);
  });

  test("point within ellipse bounding box but outside the ellipse", () => {
    const coords = { x: 1, y: 2 };
    expect(hitTestCoordsAgainstElement(element, coords)).toBe(false);
  });
});

describe("hitTestElementAgainstBox", () => {
  let element: ShapeElement;

  beforeEach(() => {
    element = createShapeElement({ shape: "rect", x: 0, y: 0, w: 10, h: 10 });
  });

  test("element has same boundingbox with target box", () => {
    const box = { x: 0, y: 0, w: 10, h: 10 };
    expect(hitTestElementAgainstBox(element, box)).toBe(true);
  });

  test("element is partially outside box", () => {
    const box = { x: 0, y: 0, w: 5, h: 5 };
    expect(hitTestElementAgainstBox(element, box)).toBe(false);
  });
});
