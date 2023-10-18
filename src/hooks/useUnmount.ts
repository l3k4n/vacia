import { useEffect, useRef } from "react";

/** runs specified callback when component unmounts */
export function useUnmount(fn: () => void) {
  const fnRef = useRef(fn);
  // update the callback ref when rerender occurs.
  fnRef.current = fn;

  useEffect(() => () => fnRef.current(), []);
}
