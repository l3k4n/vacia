type ResolverConfig = { timeout: number; maxPointerOffset: number };
interface ClickData {
  pointerDown: PointerEvent | null;
  pointerUp: PointerEvent | null;
}

class DblClickResolver {
  private firstClick: ClickData = { pointerUp: null, pointerDown: null };
  private secondClick: ClickData = { pointerUp: null, pointerDown: null };
  private pendingResetTimeout: number | null = null;
  private listener: (e: PointerEvent) => void;
  private config: ResolverConfig;

  constructor(config: ResolverConfig) {
    this.config = { ...config };
  }

  private startResetTimeout() {
    this.stopResetTimeout();
    this.pendingResetTimeout = window.setTimeout(() => {
      this.reset();
    }, this.config.timeout);
  }

  private stopResetTimeout() {
    if (this.pendingResetTimeout !== null) {
      clearTimeout(this.pendingResetTimeout);
    }
    this.pendingResetTimeout = null;
  }

  private isUsersFirstClick() {
    // first click is still pending if its events are not complete
    return !this.firstClick.pointerDown || !this.firstClick.pointerUp;
  }

  private validatePointerType() {
    // makes sure all events have the same pointerType
    const { firstClick, secondClick } = this;
    const consistentFirstClick =
      firstClick.pointerDown?.pointerType === firstClick.pointerUp?.pointerType;
    const consistentSecondClick =
      secondClick.pointerDown?.pointerType ===
      secondClick.pointerUp?.pointerType;
    const consistentDblClick =
      firstClick.pointerDown?.pointerType ===
      secondClick.pointerDown?.pointerType;

    return consistentFirstClick && consistentSecondClick && consistentDblClick;
  }

  private validatePointerPosition() {
    const dx = this.firstClick.pointerDown!.x - this.secondClick.pointerUp!.x;
    const dy = this.firstClick.pointerDown!.y - this.secondClick.pointerUp!.y;
    // offset of the pointer from where the frist pointerdown occured
    const offset = Math.abs(Math.hypot(dx, dy));

    return offset < this.config.maxPointerOffset;
  }

  private maybeDispatchEvent() {
    // make sure dblclick events are complete before validating
    if (!this.firstClick.pointerDown || !this.firstClick.pointerUp) return;
    if (!this.secondClick.pointerDown || !this.secondClick.pointerUp) return;

    if (!this.validatePointerType() || !this.validatePointerPosition()) {
      // since events are complete but invalid, the double click is invalid
      this.reset();
    } else {
      // dispatch second pointer down as the double click
      this.listener(this.secondClick.pointerDown);
      this.reset();
    }
  }

  handleEvent(e: PointerEvent) {
    let maybeDispatch = true;
    let pendingClick = this.isUsersFirstClick()
      ? this.firstClick
      : this.secondClick;

    switch (e.type) {
      case "pointerdown":
        if (this.isUsersFirstClick()) this.stopResetTimeout();
        else {
          // reset if second click occured far from the first.
          // this allows double clicking even if user just clicked elsewhere
          const dx = this.firstClick.pointerDown.x - e.x;
          const dy = this.firstClick.pointerDown.y - e.y;
          const offset = Math.abs(Math.hypot(dx, dy));
          if (offset > this.config.maxPointerOffset) {
            this.reset();
            pendingClick = this.firstClick;
          }
        }
        pendingClick.pointerDown = e;
        break;

      case "pointerup":
        // pointerdown must happen before pointerup or it is invalid
        if (!pendingClick.pointerDown) this.reset();
        else pendingClick.pointerUp = e;
        break;

      case "pointermove": {
        // reset immediately if pointer goes too far
        const offset = Math.abs(Math.hypot(e.movementX, e.movementY));
        if (offset > this.config.maxPointerOffset) {
          this.reset();
        }
        maybeDispatch = false;
        break;
      }

      default:
        maybeDispatch = false;
    }
    if (maybeDispatch) this.maybeDispatchEvent();
  }

  reset() {
    // discards all data about the pending double click
    this.stopResetTimeout();
    this.firstClick.pointerUp = null;
    this.firstClick.pointerDown = null;
    this.secondClick.pointerDown = null;
    this.secondClick.pointerUp = null;
  }

  setEventListener(callback: (e: PointerEvent) => void) {
    this.listener = callback;
  }
}

export default DblClickResolver;
