import { describe, test, expect } from "vitest";
import { createShapeElement } from "@core/elements";
import {
  getTransformHandles,
  getSelectionTransformData,
  getTransformedElementMutations,
} from "@core/elements/transform";
import {
  CanvasElement,
  RotatedBoundingBox,
  TransformHandle,
  XYCoords,
} from "@core/types";
import { getSurroundingBoundingBox } from "@core/utils";

function getTestData(
  elements: CanvasElement[],
  targetHandle: TransformHandle,
  handleDragOffset: XYCoords,
) {
  const selectionBox = getSurroundingBoundingBox(elements);
  const { x, y } = getTransformHandles(selectionBox, 1).find(
    ({ type }) => type === targetHandle,
  )!;

  const pointerPosition = {
    x: x + handleDragOffset.x,
    y: y + handleDragOffset.y,
  };

  return getSelectionTransformData(
    pointerPosition,
    targetHandle,
    selectionBox,
    elements.length > 1,
  );
}

describe("Transform element", () => {
  test("resize single element", () => {
    const element = createShapeElement({
      shape: "rect",
      x: 10,
      y: 10,
      w: 50,
      h: 50,
    });
    const transformData = getTestData([element], "se", { x: 10, y: 10 });
    const mutations = getTransformedElementMutations(
      { element, initialElement: element },
      transformData,
    );

    expect(mutations).toMatchObject({ x: 10, y: 10, w: 60, h: 60 });
  });

  test("resize multiple elements", () => {
    const elements = [
      createShapeElement({ shape: "rect", x: 20, y: 20, w: 60, h: 60 }),
      createShapeElement({ shape: "ellipse", x: 120, y: 180, w: 20, h: 100 }),
    ];
    const expectedMutations = [
      { x: 20, y: 20, w: 70, h: 70 },
      { x: 136.67, y: 206.67, w: 23.33, h: 116.67 },
    ];
    // const mutations
    const transformData = getTestData(elements, "se", { x: 20, y: 20 });

    elements.forEach((element, i) => {
      const expected = expectedMutations[i];
      const { x, y, w, h } = getTransformedElementMutations(
        { element, initialElement: element },
        transformData,
      );
      expect(x).toBeCloseTo(expected.x, 2);
      expect(y).toBeCloseTo(expected.y, 2);
      expect(w).toBeCloseTo(expected.w, 2);
      expect(h).toBeCloseTo(expected.h, 2);
    });
  });

  test("rotate single element", () => {
    const element = createShapeElement({
      shape: "rect",
      x: 10,
      y: 10,
      w: 50,
      h: 50,
    });
    const rightSideOfElement = {
      x: element.x + element.w,
      y: element.y + element.h / 2,
    };
    const transformData = getTestData([element], "rotate", rightSideOfElement);
    const { x, y, rotate } = getTransformedElementMutations(
      { element, initialElement: element },
      transformData,
    ) as RotatedBoundingBox;

    expect({ x, y }).toMatchObject({ x: element.x, y: element.y });
    /** pointer moved from top to right so it should rotate by 90deg or pi/2 */
    expect(rotate % (2 * Math.PI)).toBeCloseTo(Math.PI / 2, 2);
  });

  test("rotate multiple elements", () => {
    const elements = [
      createShapeElement({ shape: "rect", x: 20, y: 20, w: 60, h: 60 }),
      createShapeElement({ shape: "ellipse", x: 120, y: 180, w: 20, h: 100 }),
    ];
    const expectedMutations = [
      { x: 151.6, y: 144.02, rotate: 2.094395102393195 },
      { x: -24.28, y: 103.3, rotate: 2.094395102393195 },
    ];
    const transformData = getTestData(elements, "rotate", { x: 140, y: 230 });

    elements.forEach((element, i) => {
      const expected = expectedMutations[i];
      const { x, y, rotate } = getTransformedElementMutations(
        { element, initialElement: element },
        transformData,
      );

      expect(x).toBeCloseTo(expected.x, 2);
      expect(y).toBeCloseTo(expected.y, 2);
      expect(rotate % (2 * Math.PI)).toBeCloseTo(expected.rotate, 10);
    });
  });
});
