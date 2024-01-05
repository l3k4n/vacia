import { useState } from "react";

interface WysiwygProps {
  initialValue: string;
  onSubmit(value: string): void;
  onChange(value: string): void;
  styles: React.CSSProperties;
}

export default function WysiwygEditor(props: WysiwygProps) {
  const [value, setValue] = useState(props.initialValue);
  return (
    <textarea
      className="WysiwygEditor"
      style={props.styles}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        props.onChange(e.target.value);
      }}
      onBlur={() => props.onSubmit(value)}
    />
  );
}
