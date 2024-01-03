import { useState } from "react";

interface WysiwygProps {
  value: string;
  onSubmit(value: string): void;
}

const styles = { background: "none", border: "none", color: "red" };

export default function WysiwygEditor(props: WysiwygProps) {
  const [value, setValue] = useState(props.value);
  return (
    <textarea
      className="WysiwygEditor"
      style={styles}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={({ key }) => {
        if (key === "Escape") {
          props.onSubmit(value);
        }
      }}
    />
  );
}
