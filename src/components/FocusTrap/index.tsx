import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";

type TrapContainer = HTMLDivElement | null;
interface TrapProps extends React.ComponentPropsWithoutRef<"div"> {
  focusOnMount?: boolean;
  onTrapRelease?(): void;
}

const QUERY_FOCUSABLE = [
  "button",
  "input",
  "select",
  "textarea",
  "[tabindex]",
  "[href]",
].join(":not([disabled]):not([tabindex='-1']), ");

function getFocusGuardElements(container: HTMLElement) {
  const elements = container.querySelectorAll(QUERY_FOCUSABLE);
  return [elements[0], elements[elements.length - 1]] as [
    HTMLElement | null,
    HTMLElement | null,
  ];
}

const FocusTrap = forwardRef<TrapContainer, TrapProps>((props, ref) => {
  const trapContainer = useRef<TrapContainer>(null);
  const { focusOnMount, onTrapRelease, ...rest } = props;

  useImperativeHandle(ref, () => trapContainer.current!, []);
  useEffect(() => {
    if (!trapContainer.current) return undefined;
    const container = trapContainer.current;

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onTrapRelease?.();
      else if (e.key === "Tab") {
        const [first, last] = getFocusGuardElements(container);
        const goToEnd = e.shiftKey && document.activeElement === first;
        const goToStart = !e.shiftKey && document.activeElement === last;

        if (goToEnd) {
          e.preventDefault();
          last?.focus();
        } else if (goToStart) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    if (focusOnMount) {
      const [firstElement] = getFocusGuardElements(container);
      firstElement?.focus();
    }

    container.addEventListener("keydown", onKeydown);
    return () => container.removeEventListener("keydown", onKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div {...rest} ref={trapContainer} />;
});

export default FocusTrap;
