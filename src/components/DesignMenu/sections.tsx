import { useEffect, useRef, useState } from "react";
import tinycolor from "tinycolor2";
import { SelectionProps } from "./selectionDetails";
import { ProhibitedIcon } from "@assets/icons";
import { GENERIC_ELEMENT_PROPS } from "@constants";
import { EvalMathExpression, clampNumber } from "@core/utils";
import { useUnmount } from "@hooks/useUnmount";

interface MenuSectionProps {
  title: string;
  disabled?: boolean;
  children?: JSX.Element;
}

interface SectionProps<T> {
  value: T;
  disabled?: boolean;
  onChange: (value: T) => void;
}

type ColorComponents = { hex: string; opacity: string };

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

export function LayoutSection(props: SectionProps<SelectionProps["box"]>) {
  const [boundingBox, setBoundingbox] = useState(props.value);
  const { x, y, w, h } = boundingBox;

  const updateBox = (obj: Partial<typeof boundingBox>) => {
    setBoundingbox({ ...boundingBox, ...obj });
  };

  const submit = () => {
    /** since state is updated when props changes no need to manually do it */
    props.onChange({
      x: (EvalMathExpression(x) ?? props.value.x).toString(),
      y: (EvalMathExpression(y) ?? props.value.y).toString(),
      w: Math.abs(EvalMathExpression(w) ?? +props.value.w).toString(),
      h: Math.abs(EvalMathExpression(h) ?? +props.value.h).toString(),
    });
  };

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      submit();
    }
  };

  useEffect(() => setBoundingbox(props.value), [props.value]);
  useUnmount(submit);

  return (
    <MenuSection title="Layout" disabled={props.disabled}>
      <div
        className={"MS_LayoutEditor"}
        onBlur={submit}
        onKeyDown={submitOnEnter}>
        <label title="X position" tabIndex={-1}>
          <span>X</span>
          <input value={x} onChange={(e) => updateBox({ x: e.target.value })} />
        </label>
        <label title="Y position" tabIndex={-1}>
          <span>Y</span>
          <input value={y} onChange={(e) => updateBox({ y: e.target.value })} />
        </label>
        <label title="Width" tabIndex={-1}>
          <span>W</span>
          <input value={w} onChange={(e) => updateBox({ w: e.target.value })} />
        </label>
        <label title="Height" tabIndex={-1}>
          <span>H</span>
          <input value={h} onChange={(e) => updateBox({ h: e.target.value })} />
        </label>
      </div>
    </MenuSection>
  );
}

/** tinycolor helper functions */
const tcUtils = {
  getComponents: (tc: tinycolor.Instance) => ({
    hex: tc.toHexString().toUpperCase(),
    opacity: `${Math.round(tc.getAlpha() * 100)}%`,
  }),

  getColor: (components: ColorComponents, tcFallback: tinycolor.Instance) => {
    let tc = tinycolor(components.hex);

    /** use previous tc instance if current input is invalid */
    if (!tc.isValid()) tc = tcFallback;

    /** update opacity if it is not specified in hex value */
    if (tc.getFormat() !== "hex8") {
      const evaluatedOpacity = EvalMathExpression(components.opacity, "%");
      if (evaluatedOpacity !== null) {
        /** make the evaluated value a valid `Alpha` value */
        tc.setAlpha(clampNumber(evaluatedOpacity, 0, 100) / 100);
      }
    }

    return { tc, color: tc.toHex8String().toUpperCase() };
  },
};

export function ColorSection(props: SectionProps<SelectionProps["fill"]>) {
  const tc = useRef(tinycolor(props.value));
  const [color, setColor] = useState(() => tcUtils.getComponents(tc.current));
  const updateColor = (input: Partial<typeof color>) => {
    setColor({ ...color, ...input });
  };

  const submit = () => {
    const newColor = tcUtils.getColor(color, tc.current);

    tc.current = newColor.tc;
    setColor(tcUtils.getComponents(newColor.tc));
    props.onChange(newColor.color);
  };
  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      submit();
    }
  };

  useEffect(() => {
    tc.current = tinycolor(props.value);
    updateColor(tcUtils.getComponents(tc.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  useUnmount(() => props.value !== "Mixed" && submit());

  if (props.value === "Mixed") {
    /** set's the color back to its default value */
    const replaceMixedColor = () => props.onChange(GENERIC_ELEMENT_PROPS.fill);
    return (
      <MenuSection title="Fill" disabled={props.disabled}>
        <div className={"MS_ColorPicker"}>
          <button className="replaceMixedColor" onClick={replaceMixedColor}>
            Replace all Mixed Colors
          </button>
        </div>
      </MenuSection>
    );
  }

  return (
    <MenuSection title="Fill" disabled={props.disabled}>
      <div
        className={"MS_ColorPicker"}
        onBlur={submit}
        onKeyDown={submitOnEnter}>
        <button
          className="colorPreview"
          style={{ backgroundColor: props.value }}
        />
        <input
          className="hexInput"
          value={color.hex}
          onChange={(e) => updateColor({ hex: e.target.value })}
        />
        <input
          className="opacityInput"
          value={color.opacity}
          onChange={(e) => updateColor({ opacity: e.target.value })}
        />
      </div>
    </MenuSection>
  );
}
