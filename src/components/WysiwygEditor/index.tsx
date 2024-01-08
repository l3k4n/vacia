import React, { useEffect, useRef, useState } from "react";
import { XYCoords } from "@core/types";

interface WysiwygProps {
  initialValue: string;
  coords: XYCoords;
  onSubmit(value: string): void;
  onChange(value: string): void;
  styles: React.CSSProperties;
}

export default function WysiwygEditor(props: WysiwygProps) {
  const [value, setValue] = useState(props.initialValue);
  const editor = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTimeout(() => {
      // defer focusing or it fails in firefox
      // see https://stackoverflow.com/a/4641781
      editor.current?.focus();
      editor.current?.select();
    });
  }, []);

  return (
    <textarea
      className="WysiwygEditor"
      ref={editor}
      style={{
        ...props.styles,
        position: "absolute",
        left: props.coords.x,
        top: props.coords.y,
      }}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        props.onChange(e.target.value);
      }}
      onBlur={() => props.onSubmit(value)}
    />
  );
}
