import { ProhibitedIcon } from "@assets/icons";

interface MenuSectionProps {
  title: string;
  disabled?: boolean;
  children?: JSX.Element;
}

function MenuSection(props: MenuSectionProps) {
  return (
    <div
      className={`DesignMenuSection ${
        props.disabled ? "DesignMenuSection_hidden" : ""
      }`}>
      <h3 className="DesignMenuSectionTitle">
        <ProhibitedIcon />
        <span
          title={
            props.disabled
              ? `${props.title} can not be applied to current selection`
              : undefined
          }
          children={props.title}
        />
      </h3>
      <div className={"DesignMenuSectionContent"} children={props.children} />
    </div>
  );
}

export function LayoutSection(props: { disabled?: boolean }) {
  return (
    <MenuSection title="Layout" disabled={props.disabled}>
      <div className={"MS_LayoutEditor"}>
        <label title="X position" tabIndex={-1}>
          <span>X</span>
          <input value={0} />
        </label>
        <label title="Y position" tabIndex={-1}>
          <span>Y</span>
          <input value={0} />
        </label>
        <label title="Width" tabIndex={-1}>
          <span>W</span>
          <input value={0} />
        </label>
        <label title="Height" tabIndex={-1}>
          <span>H</span>
          <input value={0} />
        </label>
      </div>
    </MenuSection>
  );
}

export function ColorSection(props: { disabled?: boolean }) {
  return (
    <MenuSection title="Fill" disabled={props.disabled}>
      <div className={"MS_ColorPicker"}>
        <button className="colorPreview" style={{ backgroundColor: "#fff" }} />
        <input className="hexInput" value={"#FFFFFF"} />
        <input className="opacityInput" value={"100%"} />
      </div>
    </MenuSection>
  );
}
