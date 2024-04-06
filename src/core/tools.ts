import {
  EllipseIcon,
  HandIcon,
  PenIcon,
  RectIcon,
  SelectIcon,
  TextIcon,
} from "@assets/icons";

export const ControlTools = {
  hand: { icon: HandIcon, label: "Hand" },
  select: { icon: SelectIcon, label: "Selection" },
} as const;

export const DrawingTools = [
  { icon: RectIcon, label: "Rectangle" },
  { icon: EllipseIcon, label: "Ellipse" },
  { icon: PenIcon, label: "Freedraw" },
  { icon: TextIcon, label: "Text" },
] as const;

type cT = typeof ControlTools;
export type ControlToolLabel = cT[keyof cT]["label"];

type dT = typeof DrawingTools;
export type DrawingToolLabel = dT[number]["label"];

export type ToolLabel = DrawingToolLabel | ControlToolLabel;
