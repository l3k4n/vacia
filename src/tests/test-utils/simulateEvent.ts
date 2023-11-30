import { fireEvent } from "@testing-library/react";

export function pointerDrag(elem: HTMLElement, from: object, to: object) {
  fireEvent.pointerDown(elem, { ...from, buttons: 1 });
  fireEvent.pointerMove(elem, to);
  fireEvent.pointerUp(elem);
}

export function scrollWheel(elem: HTMLElement, step: number, options?: object) {
  const direction = Math.sign(step);
  for (let i = 0; i < Math.abs(step); i += 1) {
    fireEvent.wheel(elem, { ...options, deltaY: direction });
  }
}
