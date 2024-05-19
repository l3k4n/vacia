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
  /** the previous pointers offset relative to the device's screen */
  readonly previous_screen_offset: XYCoords;
  // flags that occur on pointer down
  readonly origin_shiftKey: boolean;
  readonly origin_ctrlKey: boolean;
  readonly origin_metaKey: boolean;
  // flags that occur on pointer move
  readonly current_shiftKey: boolean = false;
  readonly current_ctrlKey: boolean = false;
  readonly current_metaKey: boolean = false;
  /** whether or not the pointer has moved */
  readonly didMove = false;
  /** the object that was hit by the pointer on pointer down */
  hit: CanvasObject = NO_HIT;

  constructor(e: PointerEvent, state: () => AppState) {
    this.appState = state;
    this.screen_origin = { x: e.clientX, y: e.clientY };
    this.screen_offset = { x: 0, y: 0 };
    this.previous_screen_offset = { x: 0, y: 0 };
    this.origin_shiftKey = e.shiftKey;
    this.origin_ctrlKey = e.ctrlKey;
    this.origin_metaKey = e.metaKey;
  }

  move(e: PointerEvent) {
    // @ts-ignore
    this.didMove = true;
    // @ts-ignore
    this.current_shiftKey = e.shiftKey;
    // @ts-ignore
    this.current_ctrlKey = e.ctrlKey;
    // @ts-ignore
    this.current_metaKey = e.metaKey;
    this.previous_screen_offset.x = this.screen_offset.x;
    this.previous_screen_offset.y = this.screen_offset.y;
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

  get previousOffset() {
    const state = this.appState();
    return {
      x: toViewportOffset(this.previous_screen_offset.x, state),
      y: toViewportOffset(this.previous_screen_offset.y, state),
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
