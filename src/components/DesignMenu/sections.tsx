import { useEffect, useRef, useState } from "react";
import tinycolor from "tinycolor2";
import { SelectionProps } from "./selectionDetails";
import { ProhibitedIcon } from "@assets/icons";
import { DEFAULT_ELEMENT_STYLES } from "@constants";
import { EvalMathExpression, clampNumber } from "@core/utils";

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
  const [x, setX] = useState(props.value.x);
  const [y, setY] = useState(props.value.y);
  const [w, setW] = useState(props.value.w);
  const [h, setH] = useState(props.value.h);

  const updateInputs = (values: SelectionProps["box"]) => {
    setX(values.x);
    setY(values.y);
    setW(values.w);
    setH(values.h);
  };

  const submit = () => {
    const evaluatedValues = {
      x: (EvalMathExpression(x) ?? props.value.x).toString(),
      y: (EvalMathExpression(y) ?? props.value.y).toString(),
      w: (EvalMathExpression(w) ?? props.value.w).toString(),
      h: (EvalMathExpression(h) ?? props.value.h).toString(),
    };

    updateInputs(evaluatedValues);
    props.onChange(evaluatedValues);
  };

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      submit();
    }
  };

  useEffect(() => updateInputs(props.value), [props.value]);

  return (
    <MenuSection title="Layout" disabled={props.disabled}>
      <div
        className={"MS_LayoutEditor"}
        // fallback to previous value onBlur
        onBlur={() => updateInputs(props.value)}
        onKeyDown={submitOnEnter}>
        <label title="X position" tabIndex={-1}>
          <span>X</span>
          <input value={x} onChange={(e) => setX(e.target.value)} />
        </label>
        <label title="Y position" tabIndex={-1}>
          <span>Y</span>
          <input value={y} onChange={(e) => setY(e.target.value)} />
        </label>
        <label title="Width" tabIndex={-1}>
          <span>W</span>
          <input value={w} onChange={(e) => setW(e.target.value)} />
        </label>
        <label title="Height" tabIndex={-1}>
          <span>H</span>
          <input value={h} onChange={(e) => setH(e.target.value)} />
        </label>
      </div>
    </MenuSection>
  );
}

export function ColorSection(props: SectionProps<SelectionProps["fill"]>) {
  const tc = useRef(tinycolor(props.value));
  const [hexInput, setHexInput] = useState(() =>
    tc.current.toHexString().toUpperCase(),
  );
  const [opacityInput, setOpacityInput] = useState(
    () => `${tc.current.getAlpha() * 100}%`,
  );
  const [fullColor, setFullColor] = useState(() => tc.current.toHex8String());

  const updateInputs = (newTC: tinycolor.Instance) => {
    setHexInput(newTC.toHexString().toUpperCase());
    setOpacityInput(`${newTC.getAlpha() * 100}%`);
    setFullColor(newTC.toHex8String());
  };

  const submit = () => {
    const newColor = tinycolor(hexInput);

    /** if color is invalid fall back to previous valid color */
    if (!newColor.isValid()) {
      updateInputs(tc.current);
      return;
    }

    // allow math operations on opacity input
    const evaluatedOpacity = EvalMathExpression(opacityInput, "%");
    /** if color does not include alpha (i.e not an 8-char hex string),
     * then opacity was not overidden by hex, so use previous hex */
    if (newColor.getFormat() !== "hex8") {
      if (evaluatedOpacity === null) {
        /** use previous opacity if opacity is not a valid math expression */
        newColor.setAlpha(tc.current.getAlpha());
      } else {
        /** make the evaluated values a valid `Alpha` value */
        newColor.setAlpha(clampNumber(evaluatedOpacity, 0, 100) / 100);
      }
    }

    tc.current = newColor;

    updateInputs(newColor);
    props.onChange(newColor.toHex8String().toUpperCase());
  };

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      submit();
    }
  };

  /** set's the current color to a default value */
  const replaceMixedColor = () => {
    tc.current = tinycolor(DEFAULT_ELEMENT_STYLES.fill);
    updateInputs(tc.current);
    props.onChange(tc.current.toHex8String().toUpperCase());
  };

  useEffect(() => {
    tc.current = tinycolor(props.value);
    updateInputs(tc.current);
  }, [props.value]);

  return (
    <MenuSection title="Fill" disabled={props.disabled}>
      <div
        className={"MS_ColorPicker"}
        // fallback to valid color onBlur
        onBlur={() => updateInputs(tc.current)}
        onKeyDown={submitOnEnter}>
        {/* if color is Mixed only show button to replace color */}
        {props.value === "Mixed" ? (
          <button className="replaceMixedColor" onClick={replaceMixedColor}>
            Replace all Mixed Colors
          </button>
        ) : (
          <>
            <button
              className="colorPreview"
              style={{ backgroundColor: fullColor }}
            />
            <input
              className="hexInput"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
            />
            <input
              className="opacityInput"
              value={opacityInput}
              onChange={(e) => setOpacityInput(e.target.value)}
            />
          </>
        )}
      </div>
    </MenuSection>
  );
}
