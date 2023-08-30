import {
  EllipseIcon,
  HandIcon,
  PenIcon,
  RectIcon,
  SelectIcon,
} from "@assets/icons";

// is an object to allow dynamic positions when rendering
export const ControlTools = {
  hand: {
    icon: HandIcon,
    label: "Hand",
  },
  select: {
    icon: SelectIcon,
    label: "Selection",
  },
} as const;

export const DrawingTools = [
  {
    icon: RectIcon,
    label: "Rectangle",
  },
  {
    icon: EllipseIcon,
    label: "Ellipse",
  },
  {
    icon: PenIcon,
    label: "Freedraw",
  },
] as const;
