import { useEffect, useState } from "react";
import tinycolor from "tinycolor2";
import { evalMathExpr } from "./matheval";
import { MIXED_VALUE } from "./selectionDetails";
import { SectionProps, Mixed } from "./types";
import { ProhibitedIcon } from "@assets/icons";
import { GENERIC_ELEMENT_PROPS } from "@constants";
import { BoundingBox } from "@core/types";
import { clamp } from "@core/utils";
import { useUnmount } from "@hooks/useUnmount";

function MenuSection(
  props: React.PropsWithChildren<{ title: string; disabled?: boolean }>,
) {
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

export function LayoutSection({ value, onChange }: SectionProps) {
  const [x, setX] = useState(value.x.toString());
  const [y, setY] = useState(value.y.toString());
  const [w, setW] = useState(value.w.toString());
  const [h, setH] = useState(value.h.toString());

  const updateFields = (data: Mixed<BoundingBox>) => {
    setX(data.x.toString());
    setY(data.y.toString());
    setW(data.w.toString());
    setH(data.h.toString());
  };

  const pushChanges = () => {
    const changes = {
      x: evalMathExpr(x) ?? value.x,
      y: evalMathExpr(y) ?? value.y,
      w: evalMathExpr(w) ?? value.w,
      h: evalMathExpr(h) ?? value.h,
    };

    if (typeof changes.w === "number") changes.w = Math.max(1, changes.w);
    if (typeof changes.h === "number") changes.h = Math.max(1, changes.h);

    updateFields(changes);
    onChange(changes);
  };

  useEffect(() => updateFields(value), [value]);
  useUnmount(pushChanges);

  return (
    <MenuSection title="Layout">
      <div
        className={"MS_LayoutEditor"}
        onBlur={pushChanges}
        onKeyDown={(e) => e.key === "Enter" && pushChanges()}>
        <label tabIndex={-1}>
          <span>X</span>
          <input value={x} onChange={(e) => setX(e.target.value)} />
        </label>
        <label tabIndex={-1}>
          <span>Y</span>
          <input value={y} onChange={(e) => setY(e.target.value)} />
        </label>
        <label tabIndex={-1}>
          <span>W</span>
          <input value={w} onChange={(e) => setW(e.target.value)} />
        </label>
        <label tabIndex={-1}>
          <span>H</span>
          <input value={h} onChange={(e) => setH(e.target.value)} />
        </label>
      </div>
    </MenuSection>
  );
}

const getHex = (tc: tinycolor.Instance) => tc.toHexString().toUpperCase();
const getOpacity = (tc: tinycolor.Instance) =>
  `${Math.round(tc.getAlpha() * 100)}%`;

export function ColorSection(props: SectionProps) {
  const [tc, setTc] = useState(() => tinycolor(props.value.fill.toString()));
  const [rawHex, setRawHex] = useState(getHex(tc));
  const [rawOpacity, setRawOpacity] = useState(getOpacity(tc));

  const parseColorString = (value: string) => {
    if (value === "Mixed") return MIXED_VALUE;
    return value;
  };

  type ColorComponents = { hex: string; opacity: string };
  const pushChanges = (color: Partial<Mixed<ColorComponents>>) => {
    let newTc = tc;
    let didColorChange = false;

    if (typeof color.opacity === "string") {
      const evaluatedOpacity = evalMathExpr(color.opacity.replaceAll("%", ""));
      const newAlpha = evaluatedOpacity
        ? clamp(evaluatedOpacity, 0, 100) / 100
        : tc.getAlpha();

      if (newAlpha !== tc.getAlpha()) {
        didColorChange = true;
        newTc.setAlpha(newAlpha);
      }
    }

    if (
      typeof color.hex === "string" &&
      color.hex.toUpperCase() !== getHex(tc)
    ) {
      const previousAlpha = newTc.getAlpha();
      newTc = tinycolor(color.hex);
      didColorChange = newTc.isValid();

      if (newTc.isValid() && tc.getFormat() === "hex") {
        // if hex also has alpha value, overwrite the current opacity
        newTc.setAlpha(previousAlpha);
      }
    }

    if (didColorChange) {
      props.onChange({ fill: newTc.toHex8String().toUpperCase() });
      setTc(newTc);
      setRawHex(getHex(newTc));
      setRawOpacity(getOpacity(newTc));
    } else {
      // update inputs even if color is invalid
      setRawHex(getHex(tc));
      setRawOpacity(getOpacity(tc));
    }
  };

  const resetColors = () => {
    props.onChange({ fill: GENERIC_ELEMENT_PROPS.fill });
  };

  useEffect(() => {
    const previousValue = tc.getOriginalInput() as string;
    if (previousValue.toUpperCase() === props.value.fill) return;

    const newTc = tinycolor(props.value.fill.toString());
    setTc(newTc);
    setRawHex(getHex(newTc));
    setRawOpacity(getOpacity(newTc));
    // eslint-disable-next-line
  }, [props.value.fill]);

  useUnmount(() => {
    if (props.value.fill !== MIXED_VALUE) {
      pushChanges({
        hex: parseColorString(rawHex),
        opacity: parseColorString(rawOpacity),
      });
    }
  });

  const disabled = props.metadata.selectedTypes.has("freedraw");
  if (props.value.fill === MIXED_VALUE) {
    return (
      <MenuSection title="Fill" disabled={disabled}>
        <div className={"MS_ColorPicker"}>
          <button className="replaceMixedColor" onClick={resetColors}>
            Replace all Mixed Colors
          </button>
        </div>
      </MenuSection>
    );
  }

  return (
    <MenuSection title="Fill" disabled={disabled}>
      <div className={"MS_ColorPicker"}>
        <button
          className="colorPreview"
          style={{ backgroundColor: props.value.fill.toString() }}
        />
        <input
          className="hexInput"
          value={rawHex}
          onChange={(e) => setRawHex(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              pushChanges({ hex: parseColorString(rawHex) });
            }
          }}
          onBlur={(e) => pushChanges({ hex: parseColorString(e.target.value) })}
        />
        <input
          className="opacityInput"
          value={rawOpacity}
          onChange={(e) => setRawOpacity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter")
              pushChanges({ opacity: parseColorString(rawOpacity) });
          }}
          onBlur={(e) =>
            pushChanges({ opacity: parseColorString(e.target.value) })
          }
        />
      </div>
    </MenuSection>
  );
}
