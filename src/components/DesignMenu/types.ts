import { CanvasElement } from "@core/elements/types";
import { BoundingBox } from "@core/types";

type MixedObject = Readonly<{ [x: symbol]: number; toString: () => string }>;
export type Mixed<T> = { [K in keyof T]: T[K] | MixedObject };
export type SelectionProps = Readonly<Mixed<BoundingBox & { fill: string }>>;
export type SelectionMetadata = Readonly<{
  selectedTypes: Set<CanvasElement["type"]>;
  multipleElements: boolean;
}>;
export interface SectionProps {
  value: SelectionProps;
  metadata: SelectionMetadata;
  onChange: (value: Partial<SelectionProps>) => void;
}
export type SectionComponent = (props: SectionProps) => JSX.Element;

export type ToolbarPosition = "top" | "left" | "right" | "bottom";
