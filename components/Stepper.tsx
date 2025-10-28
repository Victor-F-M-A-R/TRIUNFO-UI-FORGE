"use client";
export type Step = 1 | 2 | 3 | 4;

export default function Stepper({
  labels,
  current,
}: {
  labels: string[];
  current: Step;
}) {
  return (
    <ol className="flex flex-wrap gap-3 text-xs">
      {labels.map((label, i) => {
        const n = (i + 1) as Step;
        const done = current > n;
        const active = current === n;
        const base = "px-3 py-1 rounded-full ring-1 flex items-center gap-2 ";
        const cls = done
          ? "bg-emerald-700 text-emerald-100 ring-emerald-600"
          : active
          ? "bg-sky-700 text-sky-100 ring-sky-600"
          : "bg-slate-800 text-slate-300 ring-slate-700";
        const itemClass = base + cls;
        const dotClass = done
          ? "bg-emerald-300"
          : active
          ? "bg-sky-300"
          : "bg-slate-500";
        return (
          <li key={n} className={itemClass}>
            <span className={"h-1.5 w-1.5 rounded-full " + dotClass} />
            <span>
              {n}. {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
