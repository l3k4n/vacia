/* eslint-disable no-use-before-define */
import {
  Item,
  ItemIndicator,
  Content,
  SubContent,
  Portal,
  Root,
  Trigger,
  Sub,
  SubTrigger,
  CheckboxItem,
  Separator,
} from "@radix-ui/react-context-menu";
import React from "react";
import "./style.scss";

export interface ContextMenuSeparator {
  type: "separator";
}

export interface ContextMenuButton {
  type: "button";
  label: string;
  icon?: string | null;
  binding?: string;
  exec: () => void;
}

export interface ContextMenuCheckbox {
  type: "checkbox";
  label: string;
  binding?: string;
  checked?: boolean;
  exec: () => void;
}

export interface ContextMenuDropdown {
  type: "dropdown";
  label: string;
  options: (ContextMenuButton | ContextMenuCheckbox | ContextMenuSeparator)[];
}

export type ContextMenuItem =
  | ContextMenuButton
  | ContextMenuDropdown
  | ContextMenuCheckbox
  | ContextMenuSeparator;

export interface CMenuProps extends React.PropsWithChildren {
  items: ContextMenuItem[];
}

function RenderCMenuItems({ items }: { items: ContextMenuItem[] }) {
  return (
    <>
      {items.map((item, i) => {
        switch (item.type) {
          case "button":
            return <CMenuButton key={i} item={item} />;
          case "dropdown":
            return <CMenuDropdown key={i} item={item} />;
          case "checkbox":
            return <CMenuCheckBox key={i} item={item} />;
          case "separator":
            return <Separator key={i} className="CMenuSeparator" />;
          default:
            return null;
        }
      })}
    </>
  );
}

function CMenuButton({ item }: { item: ContextMenuButton }) {
  return (
    <Item className="CMenuEntry" onSelect={item.exec}>
      {item.label}
      <div className="CMenuBinding">⌘+S</div>
    </Item>
  );
}

function CMenuCheckBox(props: { item: ContextMenuCheckbox }) {
  const { checked, label, exec } = props.item;
  return (
    <CheckboxItem className="CMenuEntry" checked={checked} onSelect={exec}>
      <ItemIndicator className="CMenuChecked">
        <svg width="24" height="24" viewBox="0 0 24 24">
          {/* eslint-disable */}
          <path d="m10 15.586-3.293-3.293-1.414 1.414L10 18.414l9.707-9.707-1.414-1.414z" />
        </svg>
      </ItemIndicator>
      {label}
      <div className="CMenuBinding" children={"⌘+B"} />
    </CheckboxItem>
  );
}

function CMenuDropdown({ item }: { item: ContextMenuDropdown }) {
  return (
    <Sub>
      <SubTrigger className="CMenuEntry">
        {item.label}
        <div className="CMenuBinding">
          <svg width="24" height="24" viewBox="0 0 24 24">
            {/* eslint-disable */}
            <path d="M10.707 17.707 16.414 12l-5.707-5.707-1.414 1.414L13.586 12l-4.293 4.293z" />
          </svg>
        </div>
      </SubTrigger>
      <Portal>
        <SubContent className="ContextMenu" sideOffset={5}>
          <RenderCMenuItems items={item.options} />
        </SubContent>
      </Portal>
    </Sub>
  );
}

export default function ContextMenu({ children, items }: CMenuProps) {
  return (
    <Root>
      <Trigger children={children} />
      <Portal>
        <Content className="ContextMenu" loop>
          <RenderCMenuItems items={items} />
        </Content>
      </Portal>
    </Root>
  );
}
