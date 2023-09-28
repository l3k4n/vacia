import { describe, test, expect } from "vitest";
import { invertNegativeBoundingBox, EvalMathExpression } from "@core/utils";

describe("Test MathExpression evaluator", () => {
  test("addition and subtraction", () => {
    expect(EvalMathExpression("30 + 12")).toEqual(42);
    expect(EvalMathExpression("-360.2 - 2")).toEqual(-362.2);
  });

  test("division and multiplication", () => {
    expect(EvalMathExpression("4*2")).toEqual(8);
    expect(EvalMathExpression("100.4/4")).toEqual(25.1);
  });
});

describe("Invert negative bounding box", () => {
  const positiveBox = { x: 50, y: 50, w: 50, h: 50 };
  const negativeBox = { x: 50, y: 50, w: -50, h: -50 };
  const invertedNegativeBox = { x: 0, y: 0, w: 50, h: 50 };

  test("Do nothing to positive box", () => {
    const { box, didFlipX, didFlipY } = invertNegativeBoundingBox(positiveBox);

    expect(didFlipX).toEqual(false);
    expect(didFlipY).toEqual(false);
    expect(box).toMatchObject({ ...positiveBox });
  });

  test("invert negative box", () => {
    const { box, didFlipX, didFlipY } = invertNegativeBoundingBox(negativeBox);

    expect(didFlipX).toEqual(true);
    expect(didFlipY).toEqual(true);
    expect(box).toMatchObject(invertedNegativeBox);
  });
});
