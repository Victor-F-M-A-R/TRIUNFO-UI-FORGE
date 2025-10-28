"use client";

import React, { useEffect, useState } from "react";

export default function DemoModeToggle({
  target,
}: {
  target: React.RefObject<HTMLElement>;
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    if (on) el.classList.add("qa-demo-mode");
    else el.classList.remove("qa-demo-mode");
  }, [on, target]);

  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => setOn(e.target.checked)}
      />
      <span>Mostrar exemplos de erro</span>
    </label>
  );
}
