import { XYCoords } from "@core/types";

interface ComponentMap {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: React.FC<any>;
}

type CoordTransformer = (coords: XYCoords) => XYCoords;
interface OverlayParams<T extends ComponentMap> {
  zIndex?: number;
  virtualCoords: XYCoords;
  props: React.ComponentProps<T[keyof T]>;
  onMount?: () => void;
}

interface ActiveOverlay<T extends ComponentMap> extends OverlayParams<T> {
  id: keyof T;
  component: React.FC;
  key: number;
}

function createOverlayKey() {
  return Date.now() * Math.floor(Math.random() * 100);
}

export class OverlayManager<T extends ComponentMap> {
  private overlayComponents: T;
  private activeOverlays: ActiveOverlay<T>[];
  private onChange: () => void;
  private getScreenCoords: CoordTransformer;

  constructor(
    componentMap: T,
    getScreenCoords: CoordTransformer,
    onChange: () => void,
  ) {
    this.overlayComponents = componentMap;
    this.activeOverlays = [];
    this.onChange = onChange;
    this.getScreenCoords = getScreenCoords;
  }

  private getActiveOverlay(id: keyof T) {
    return this.activeOverlays.find((overlay) => overlay.id === id);
  }

  open(id: keyof T, data: OverlayParams<T>) {
    const component = this.overlayComponents[id];

    // return if `id` is invalid or overlay is already open
    if (!component || this.getActiveOverlay(id)) return;

    // changing `key` will result in component remounting
    const key = createOverlayKey();
    this.activeOverlays.push({ id, component, key, ...data });

    this.onChange();
  }

  close(id: keyof T) {
    const overlay = this.getActiveOverlay(id);
    if (!overlay) return;

    const index = this.activeOverlays.indexOf(overlay);
    if (index === -1) return;

    this.activeOverlays.splice(index, 1);
    this.onChange();
  }

  closeAll() {
    this.activeOverlays.length = 0;
    this.onChange();
  }

  render() {
    if (!this.activeOverlays.length) return null;

    return this.activeOverlays.map((overlay) => {
      const position = this.getScreenCoords(overlay.virtualCoords);

      if (overlay.onMount) {
        // defer mount so the component is rendered before it is called
        window.setTimeout(() => {
          overlay.onMount?.();
          // eslint-disable-next-line no-param-reassign
          overlay.onMount = undefined;
        });
      }

      return (
        <div
          key={overlay.key}
          style={{ position: "absolute", left: position.x, top: position.y }}>
          <overlay.component {...overlay.props} />
        </div>
      );
    });
  }
}
