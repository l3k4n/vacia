import { useEffect, useMemo, useState } from "react";
import { useUnmount } from "../../hooks/useUnmount";
import { ProhibitedIcon } from "@assets/icons";
import { BoundingBox } from "@core/types";
import { ColorTransformer, EvalMathExpression, clampNumber } from "@core/utils";

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

const blurTextInputOnEnterKey = (e: React.KeyboardEvent) => {
  const target = e.target as HTMLElement;

  if (e.key === "Enter" && target.tagName === "INPUT") {
    (e.target as HTMLElement).blur();
  }
};

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

export function LayoutSection(props: SectionProps<BoundingBox>) {
  const [x, setX] = useState(props.value.x.toString());
  const [y, setY] = useState(props.value.y.toString());
  const [w, setW] = useState(props.value.w.toString());
  const [h, setH] = useState(props.value.h.toString());

  /** Evaluates input string as a number or math expression and returns the
   * result or 0 if input is invalid. */
  const evalInput = (value: string): number => {
    const intValue = +value.replaceAll(" ", "");
    if (Number.isFinite(intValue)) return intValue;
    return EvalMathExpression(value) ?? 0;
  };

  const submit = () => {
    const values = {
      x: evalInput(x),
      y: evalInput(y),
      w: evalInput(w),
      h: evalInput(h),
    };

    setX(values.x.toString());
    setY(values.y.toString());
    setW(values.w.toString());
    setH(values.h.toString());

    props.onChange(values);
  };

  useUnmount(submit);

  return (
    <MenuSection title="Layout" disabled={props.disabled}>
      <div
        className={"MS_LayoutEditor"}
        onBlur={submit}
        // blurs the input and submitting is handled by the onBlur event
        onKeyDown={blurTextInputOnEnterKey}>
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

export function ColorSection(props: SectionProps<string>) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const colorTransformer = useMemo(
    () => new ColorTransformer(props.value),
    [props.value],
  );

  const [hex, setHex] = useState(colorTransformer.getHex);
  const [opacity, setOpacity] = useState(colorTransformer.getOpacity);
  const [fullColor, setFullColor] = useState(colorTransformer.getFullColor);

  const submit = () => {
    // evaluate opacity as math expression
    const evaluatedOpacity = EvalMathExpression(opacity, "%");
    if (evaluatedOpacity !== null) {
      colorTransformer.setOpacity(`${clampNumber(evaluatedOpacity, 0, 100)}%`);
    } else {
      colorTransformer.setOpacity(opacity);
    }

    colorTransformer.setColor(hex);

    setHex(colorTransformer.getHex());
    setOpacity(colorTransformer.getOpacity());
    setFullColor(colorTransformer.getFullColor());

    props.onChange(colorTransformer.getFullColor());
  };

  const onBlur = (e: React.FocusEvent) => {
    if ((e.target as HTMLElement).tagName === "INPUT") {
      submit();
    }
  };

  useEffect(() => {
    setHex(colorTransformer.getHex());
    setOpacity(colorTransformer.getOpacity());
    setFullColor(colorTransformer.getFullColor());
  }, [colorTransformer]);

  useUnmount(submit);

  return (
    <MenuSection title="Fill" disabled={props.disabled}>
      <div
        className={"MS_ColorPicker"}
        onBlur={onBlur}
        onKeyDown={blurTextInputOnEnterKey}>
        <button
          className="colorPreview"
          style={{ backgroundColor: fullColor }}
        />
        <input
          className="hexInput"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
        />
        <input
          className="opacityInput"
          value={opacity}
          onChange={(e) => setOpacity(e.target.value)}
        />
      </div>
    </MenuSection>
  );
}
