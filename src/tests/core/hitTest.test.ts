import { describe, test, expect } from "vitest";
import { createAppState } from "@core/createState";
import { createShapeElement } from "@core/elements";
import { getTransformHandles } from "@core/elements/transform";
import {
  hitTestCoordsAgainstElement,
  hitTestCoordsAgainstTransformHandles,
  hitTestElementAgainstUnrotatedBox,
} from "@core/hitTest";

describe("hitTestElement", () => {
  const element = createShapeElement({
    shape: "ellipse",
    x: 0,
    y: 0,
    w: 20,
    h: 20,
  });
  const pointer = { x: 5, y: 5 };

  test("without rotation", () => {
    expect(hitTestCoordsAgainstElement(element, pointer)).toBe(true);
  });

  test("with rotation", () => {
    expect(
      hitTestCoordsAgainstElement({ ...element, rotate: Math.PI }, pointer),
    ).toBe(true);
  });
});

describe("hitTestTransformHandles", () => {
  const element = createShapeElement({
    shape: "ellipse",
    x: 0,
    y: 0,
    w: 20,
    h: 20,
  });
  const pointer = { x: element.x, y: element.y };
  const appState = createAppState();

  test("without rotation", () => {
    const handles = getTransformHandles(element, 1);
    const hitHandle = hitTestCoordsAgainstTransformHandles(
      handles,
      pointer,
      appState,
    );

    expect(hitHandle).toBe("nw");
  });

  test("with rotation", () => {
    const handles = getTransformHandles({ ...element, rotate: Math.PI }, 1);
    const hitHandle = hitTestCoordsAgainstTransformHandles(
      handles,
      pointer,
      appState,
    );

    expect(hitHandle).toBe("se");
  });
});

describe("hitTestElementInBox", () => {
  const element = createShapeElement({
    shape: "ellipse",
    x: 0,
    y: 0,
    w: 20,
    h: 20,
  });
  const box = { x: 0, y: 0, w: 20, h: 20 };

  test("without rotation", () => {
    expect(hitTestElementAgainstUnrotatedBox(element, box)).toBe(true);
  });

  test("with rotation", () => {
    expect(
      hitTestElementAgainstUnrotatedBox(
        { ...element, rotate: Math.PI / 4 },
        box,
      ),
    ).toBe(false);

    expect(
      hitTestElementAgainstUnrotatedBox(
        { ...element, rotate: Math.PI / 4 },
        { x: -10, y: -10, w: 40, h: 40 },
      ),
    ).toBe(true);
  });
});
