import { render, screen } from "@testing-library/react";
import App from "../App";
import "pepjs";

export function getTools() {
  return {
    hand: screen.getByTestId("toolitem-hand"),
    select: screen.getByTestId("toolitem-selection"),
    rect: screen.getByTestId("toolitem-rectangle"),
    ellipse: screen.getByTestId("toolitem-ellipse"),
    pen: screen.getByTestId("toolitem-freedraw"),
  };
}

export function renderApp() {
  render(<App />);
  return { canvas: screen.getByTestId("app-canvas"), tools: getTools() };
}
