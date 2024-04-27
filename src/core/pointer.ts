import { CanvasObject } from "./elements/types";
import { toViewportCoords, toViewportOffset } from "./utils";
import { AppState, BoundingBox, XYCoords } from "@core/types";

const NO_HIT = Object.freeze({ type: null });

export class CanvasPointer {
  private appState: () => AppState;

  /** the pointers origin relative to the device's screen */
  readonly screen_origin: XYCoords;
  /** the pointers offset relative to the device's screen */
  readonly screen_offset: XYCoords;
  /** the object that was hit by the pointer when it was created */
  hit: CanvasObject = NO_HIT;
  readonly didMove = false;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;

  constructor(e: PointerEvent, state: () => AppState) {
    this.appState = state;
    this.screen_origin = { x: e.clientX, y: e.clientY };
    this.screen_offset = { x: 0, y: 0 };
    this.shiftKey = e.shiftKey;
    this.ctrlKey = e.ctrlKey;
  }

  move(e: PointerEvent) {
    // @ts-ignore
    this.didMove = true;
    this.screen_offset.x = e.clientX - this.screen_origin.x;
    this.screen_offset.y = e.clientY - this.screen_origin.y;
  }

  get origin() {
    return toViewportCoords(this.screen_origin, this.appState());
  }

  get offset() {
    const state = this.appState();
    return {
      x: toViewportOffset(this.screen_offset.x, state),
      y: toViewportOffset(this.screen_offset.y, state),
    };
  }

  /** returns a box created from the pointers origin to the current position */
  get dragBox(): BoundingBox {
    const { x: dx, y: dy } = this.offset;
    return { ...this.origin, w: dx, h: dy };
  }

  get currentPosition(): XYCoords {
    const { x, y } = this.origin;
    const { x: dx, y: dy } = this.offset;
    return { x: x + dx, y: y + dy };
  }
}
