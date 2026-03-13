"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts a number up from 0 to `target` over `duration` ms (default 1000ms).
 * Returns the current animated value.
 */
export function useCountUp(target: number, duration = 1000): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const prevTargetRef = useRef(target);

  useEffect(() => {
    if (target === prevTargetRef.current && value !== 0) return;
    prevTargetRef.current = target;
    startRef.current = null;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(ease * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  return value;
}
