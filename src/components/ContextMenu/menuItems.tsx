import {
  ContextMenuButton,
  ContextMenuDropdown,
  ContextMenuItem,
} from "@core/types";

interface Props<T extends ContextMenuItem> {
  item: T;
  onClick(e: React.MouseEvent<HTMLButtonElement>): void;
  onMouseEnter(e: React.MouseEvent<HTMLButtonElement>): void;
}

export function Button(props: Props<ContextMenuButton>) {
  return (
    <button
      className="ContextMenuItem"
      onClick={props.onClick}
      onMouseEnter={props.onMouseEnter}>
      <span className="CMenuItemIcon">{props.item.icon}</span>
      <span className="CMenuItemLabel">{props.item.label}</span>
      {props.item.binding && (
        <span className="CMenuItemBinding">{props.item.binding}</span>
      )}
    </button>
  );
}

export function Dropdown(props: Props<ContextMenuDropdown>) {
  return (
    <button
      className="ContextMenuItem"
      onClick={props.onClick}
      onMouseEnter={props.onMouseEnter}>
      <span className="CMenuItemIcon">O</span>
      <span className="CMenuItemLabel">{props.item.label}</span>
      <span className="CMenuItemChevron">{">"}</span>
    </button>
  );
}

export function Separator() {
  return <div className="ContextMenuSeparator" />;
}
