import { describe, test, expect } from "vitest";

import { createShapeElement } from "../test-utils/elements";
import {
  hitTestElementAgainstBox,
  hitTestCoordsAgainstElement,
} from "@core/hitTest";

describe("hitTestShape", () => {
  test("point within shape", () => {
    const coords = { x: 5, y: 5 };
    const element = createShapeElement("rect", { x: 0, y: 0, w: 10, h: 10 });

    expect(hitTestCoordsAgainstElement(element, coords)).toBe(true);
  });

  test("point within ellipse bounding box but outside the ellipse", () => {
    const coords = { x: 1, y: 2 };
    const element = createShapeElement("ellipse", { x: 0, y: 0, w: 20, h: 20 });

    expect(hitTestCoordsAgainstElement(element, coords)).toBe(false);
  });
});

describe("hitTestElementAgainstBox", () => {
  test("element has same boundingbox with target box", () => {
    const box = { x: 0, y: 0, w: 10, h: 10 };
    const element = createShapeElement("rect", { x: 0, y: 0, w: 10, h: 10 });

    expect(hitTestElementAgainstBox(element, box)).toBe(true);
  });

  test("element is partially outside box", () => {
    const box = { x: 0, y: 0, w: 5, h: 5 };
    const element = createShapeElement("rect", { x: 0, y: 0, w: 10, h: 10 });

    expect(hitTestElementAgainstBox(element, box)).toBe(false);
  });
});
