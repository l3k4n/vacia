import { EllipseIcon, PenIcon, RectIcon, SelectIcon } from "@assets/icons";

const DrawingTools = [
  {
    icon: SelectIcon,
    label: "Selection",
  },
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

export default DrawingTools;
