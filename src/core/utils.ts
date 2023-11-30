/* eslint-disable @typescript-eslint/ban-ts-comment */
import { BoundingBox, RotatedBoundingBox, XYCoords } from "./types";

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Inverts a the width or height of a bounding box if they are negative and
 * returns which axes were inverted. (Note: Visually, position of bounding
 * box will not change) */
export function invertNegativeBoundingBox(box: BoundingBox): {
  box: BoundingBox;
  didFlipX: boolean;
  didFlipY: boolean;
} {
  let { x, y, w, h } = box;
  let didFlipX = false;
  let didFlipY = false;

  if (box.w < 0) {
    w *= -1;
    x -= w;
    didFlipX = true;
  }
  if (box.h < 0) {
    h *= -1;
    y -= h;
    didFlipY = true;
  }

  return { didFlipX, didFlipY, box: { x, y, w, h } };
}

/** evalutes a string as a math expression and returns result or null if string
 * is invalid */
export function EvalMathExpression(exp: string, units?: string): number | null {
  if (!exp.length) return null;
  // eslint-disable-next-line no-param-reassign
  exp = exp.replaceAll(" ", "");
  if (units) {
    // remove units if preset
    // eslint-disable-next-line no-param-reassign
    exp = exp.replaceAll(units, "");
  }
  if (Number.isFinite(+exp)) {
    // return if value is a number literal
    return +exp;
  }
  const tokens = exp
    .replaceAll(" ", "")
    .match(/^([+-]?)(\d+(?:\.\d+)?)([-+*/])([+-]?)(\d+(?:\.\d+)?)$/);

  if (tokens) {
    const num1 = +(tokens[1] + [tokens[2]]);
    const num2 = +(tokens[4] + tokens[5]);
    const operator = tokens[3] as "+" | "-" | "*" | "/";
    let result = 0;

    switch (operator) {
      case "+":
        result = num1 + num2;
        break;
      case "-":
        result = num1 - num2;
        break;
      case "*":
        result = num1 * num2;
        break;
      case "/":
        result = num1 / num2;
        break;
      default:
    }

    if (!Number.isFinite(result)) {
      result = 0;
    }

    return result;
  }

  return null;
}

/** returns all properties of the target object that are different from the
 * corresponding property in the comparedObject.
 * @param target object to compare
 * @param comparedObject object to compare against
 * */
export function shallowDiff<T extends object, S extends object>(
  target: S,
  comparedObject: T,
): Partial<S> {
  const keys = Object.keys(target);
  const diff = {};

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    // @ts-ignore
    if (target[key] !== comparedObject[key]) {
      // @ts-ignore
      diff[key] = target[key];
    }
  }

  return diff as Partial<S>;
}
export function rotatePointAroundAnchor(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  angle: number,
): XYCoords {
  return {
    x: Math.cos(angle) * (x1 - x2) - Math.sin(angle) * (y1 - y2) + x2,
    y: Math.sin(angle) * (x1 - x2) + Math.cos(angle) * (y1 - y2) + y2,
  };
}

/** returns the rotated coords of a bounding box in a clockwise direction
 * starting from the top-left */
export function getRotatedBoxCoords(box: RotatedBoundingBox): XYCoords[] {
  const x1 = box.x;
  const x2 = x1 + box.w;
  const y1 = box.y;
  const y2 = y1 + box.h;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;

  return [
    rotatePointAroundAnchor(x1, y1, cx, cy, box.rotate), // nw
    rotatePointAroundAnchor(x2, y1, cx, cy, box.rotate), // ne
    rotatePointAroundAnchor(x1, y2, cx, cy, box.rotate), // sw
    rotatePointAroundAnchor(x2, y2, cx, cy, box.rotate), // se
  ];
}

export function getSurroundingBoundingBox(
  boxes: RotatedBoundingBox[],
): RotatedBoundingBox {
  if (boxes.length < 1) return { x: 0, y: 0, w: 0, h: 0, rotate: 0 };
  if (boxes.length === 1) {
    // if there is a single box return its bounds
    const { x, y, w, h, rotate } = boxes[0];
    return { x, y, w, h, rotate };
  }
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;

  for (let i = 0; i < boxes.length; i += 1) {
    const [nw, ne, sw, se] = getRotatedBoxCoords(boxes[i]);

    x1 = Math.min(x1, nw.x, ne.x, se.x, sw.x);
    y1 = Math.min(y1, nw.y, ne.y, se.y, sw.y);
    x2 = Math.max(x2, nw.x, ne.x, se.x, sw.x);
    y2 = Math.max(y2, nw.y, ne.y, se.y, sw.y);
  }

  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1, rotate: 0 };
}
