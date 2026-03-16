"use client";

import { RefObject, useEffect, useState } from "react";

export function useInView<T extends HTMLElement>(
  ref: RefObject<T>,
  options?: IntersectionObserverInit,
  once = true
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -10% 0px",
        ...options,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, options, once]);

  return inView;
}
