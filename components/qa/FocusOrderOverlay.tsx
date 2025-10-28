// components/qa/FocusOrderOverlay.tsx
"use client";
import React, { useEffect, useState } from "react";

export function FocusOrderOverlay({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [focusableElements, setFocusableElements] = useState<
    Array<{ element: Element; index: number; rect: DOMRect }>
  >([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const elements = Array.from(
      containerRef.current.querySelectorAll(selector)
    );

    const mapped = elements.map((el, i) => ({
      element: el,
      index: i + 1,
      rect: el.getBoundingClientRect(),
    }));

    setFocusableElements(mapped);
  }, [containerRef]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {focusableElements.map((item) => (
        <div
          key={item.index}
          className="absolute bg-blue-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white"
          style={{
            left: item.rect.left + window.scrollX,
            top: item.rect.top + window.scrollY,
          }}
        >
          {item.index}
        </div>
      ))}
    </div>
  );
}
