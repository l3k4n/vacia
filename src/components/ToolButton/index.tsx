import "./style.scss";

interface RadioToolProps {
  type: "radio";
  label: string;
  children?: React.ReactNode;
  name: string;
  checked: boolean;
  onChange?(): void;
  testId?: string;
}
interface ButtonToolProps {
  type: "button";
  label: string;
  children?: React.ReactNode;
  onClick?(event: React.MouseEvent): void;
  testId?: string;
}
type ToolProps = RadioToolProps | ButtonToolProps;

export default function ToolButton(props: ToolProps) {
  if (props.type === "button") {
    return (
      <button
        type="button"
        className="ToolButton ToolButton_type_button"
        title={props.label}
        children={props.children}
        onClick={props.onClick}
        data-testid={props.testId}
      />
    );
  }
  return (
    <label
      className="ToolButton ToolButton_type_radio"
      title={props.label}
      data-testid={props.testId}>
      <input
        type="radio"
        name={props.name}
        checked={props.checked}
        aria-label={props.label}
        onChange={props.onChange}
        className="ToolButton_type_radio--checkbox"
      />
      <div className="ToolButton_type_radio--icon" children={props.children} />
    </label>
  );
}
