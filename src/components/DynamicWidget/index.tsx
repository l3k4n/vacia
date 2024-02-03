import { useLayoutEffect, useRef } from "react";
import { BoundingBox, XYCoords } from "@core/types";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  containerBounds: BoundingBox;
  position: XYCoords;
  padding?: number;
}

function getAdjustedCoords(
  container: BoundingBox,
  widget: BoundingBox,
  padding = 0,
) {
  let bounds = container;
  let { x, y } = widget;

  // apply padding to bounds
  if (padding) {
    bounds = {
      x: container.x + padding,
      y: container.y + padding,
      w: container.w - padding * 2,
      h: container.h - padding * 2,
    };
  }

  if (widget.x < bounds.x) x = bounds.x;
  if (widget.y < bounds.y) y = bounds.y;
  if (widget.x + widget.w > bounds.x + bounds.w) {
    x = bounds.x + bounds.w - widget.w;
  }
  if (widget.y + widget.h > bounds.y + bounds.h) {
    y = bounds.y + bounds.h - widget.h;
  }

  return { x, y };
}

export default function DynamicWidget(props: Props) {
  const widgetRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!widgetRef.current) return;
    const { x, y } = props.position;
    const { width, height } = widgetRef.current.getBoundingClientRect();
    const coords = getAdjustedCoords(
      props.containerBounds,
      { x, y, w: width, h: height },
      props.padding,
    );

    widgetRef.current.style.top = `${coords.y}px`;
    widgetRef.current.style.left = `${coords.x}px`;
  }, [props]);

  const { containerBounds, ...rest } = props;
  return <div {...rest} ref={widgetRef} style={{ position: "absolute" }} />;
}
