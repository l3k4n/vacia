import { AppState, XYCoords } from "./types";

// eslint-disable-next-line import/prefer-default-export
export function getVisibleCenterCoords(state: AppState): XYCoords {
  return {
    x: state.width / 2,
    y: state.height / 2,
  };
}
