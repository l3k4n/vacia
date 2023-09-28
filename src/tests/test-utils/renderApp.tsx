import { render, screen } from "@testing-library/react";
import App from "../../App";
import "pepjs";

export function renderApp() {
  render(<App />);
  return { canvas: screen.getByTestId("app-canvas") };
}
