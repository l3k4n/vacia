import { useState } from "react";
import { Button, Dropdown, Separator } from "./menuItems";
import DynamicWidget from "@components/DynamicWidget";
import FocusTrap from "@components/FocusTrap";
import {
  BoundingBox,
  ContextMenuDropdown,
  ContextMenuItem,
  XYCoords,
} from "@core/types";
import "./style.scss";

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: XYCoords;
  containerBounds: BoundingBox;
  onClose(): void;
}

interface WidgetProps {
  items: ContextMenuItem[];
  position: XYCoords;
  containerBounds: BoundingBox;
  focusOnMount: boolean;
  onItemClick(e: React.MouseEvent, item: ContextMenuItem): void;
  onItemHover(e: React.MouseEvent, item: ContextMenuItem): void;
  onClose(): void;
}

interface DropdownProps {
  items: ContextMenuItem[];
  position: XYCoords;
  focusOnMount: boolean;
  onClose(): void;
}

function ContextMenuWidget(props: WidgetProps) {
  return (
    <>
      <DynamicWidget
        className="ContextMenu"
        containerBounds={props.containerBounds}
        position={props.position}>
        <FocusTrap
          focusOnMount={props.focusOnMount}
          onTrapRelease={props.onClose}>
          {props.items.map((item, i) => {
            switch (item.type) {
              case "button":
                return (
                  <Button
                    key={i}
                    item={item}
                    onClick={(e) => props.onItemClick(e, item)}
                    onMouseEnter={(e) => props.onItemHover(e, item)}
                  />
                );
              case "dropdown":
                return (
                  <Dropdown
                    key={i}
                    item={item}
                    onClick={(e) => props.onItemClick(e, item)}
                    onMouseEnter={(e) => props.onItemHover(e, item)}
                  />
                );
              case "separator":
                return <Separator key={i} />;
              default:
                return null;
            }
          })}
        </FocusTrap>
      </DynamicWidget>
    </>
  );
}

export function ContextMenu(props: ContextMenuProps) {
  const [dropdown, setDropdown] = useState<DropdownProps | null>(null);

  const openDropdown = (
    el: Element,
    item: ContextMenuDropdown,
    focus = false,
  ) => {
    const { y, right } = el.getBoundingClientRect();
    setDropdown({
      items: item.options,
      position: { x: right, y },
      focusOnMount: focus,
      onClose: () => {
        (el as Partial<HTMLElement>).focus?.();
        setDropdown(null);
      },
    });
  };

  return (
    <>
      <ContextMenuWidget
        items={props.items}
        position={props.position}
        containerBounds={props.containerBounds}
        focusOnMount={true}
        onItemClick={(e, item) => {
          if (item.type === "dropdown") {
            openDropdown(e.currentTarget, item, true);
          } else if (item.type === "button") {
            item.exec();
            props.onClose();
          }
        }}
        onItemHover={(e, item) => {
          (e.currentTarget as Partial<HTMLElement>).focus?.();
          if (item.type === "dropdown") {
            openDropdown(e.currentTarget, item);
          } else setDropdown(null);
        }}
        onClose={props.onClose}
      />
      {dropdown && (
        <ContextMenuWidget
          items={dropdown.items}
          position={dropdown.position}
          containerBounds={props.containerBounds}
          focusOnMount={dropdown.focusOnMount}
          onItemClick={(_, item) => {
            // only handle button because dropdowns can't be inside eachother
            if (item.type === "button") item.exec();
            props.onClose();
          }}
          onItemHover={(e) => {
            (e.currentTarget as Partial<HTMLElement>).focus?.();
          }}
          onClose={dropdown.onClose}
        />
      )}
    </>
  );
}
