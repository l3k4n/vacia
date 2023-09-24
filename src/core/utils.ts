/* eslint-disable @typescript-eslint/ban-ts-comment */
import tinycolor from "tinycolor2";
import { AppState, XYCoords, BoundingBox } from "./types";

/** returns the center position of in screen coords */
export function getScreenCenterCoords(state: AppState): XYCoords {
  return {
    x: state.width / 2,
    y: state.height / 2,
  };
}

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
  if (units) {
    // remove units if preset
    // eslint-disable-next-line no-param-reassign
    exp = exp.replaceAll(units, "");
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

/** converts colors between different formats */
export class ColorTransformer {
  private tc: ReturnType<typeof tinycolor>;
  constructor(str: string) {
    this.tc = tinycolor(str);
  }

  setColor(color: string) {
    const newColor = tinycolor(color);

    if (newColor.isValid()) {
      /** if color does not include alpha (i.e 8 char hex),
       * use previous alpha */
      if (newColor.getFormat() !== "hex8") {
        newColor.setAlpha(this.tc.getAlpha());
      }
      this.tc = newColor;
    }

    return this;
  }

  setOpacity(opacity: string) {
    const alpha = +opacity.split("%")[0] / 100;
    this.tc.setAlpha(alpha);

    return this;
  }

  getHex = () => this.tc.toHexString().toUpperCase();

  getOpacity = () => `${(this.tc.getAlpha() * 100).toFixed(0)}%`;

  getFullColor = () => this.tc.toHex8String();
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
