import { act } from "react-dom/test-utils";
import { ToolLabel } from "@core/types";

export function selectTool(tool: ToolLabel) {
  act(() => {
    window.appData.setState({ activeTool: tool });
  });
}
