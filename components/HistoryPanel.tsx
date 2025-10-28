"use client";
import { useEffect, useState } from "react";
import { db, type ResultRecord } from "../lib/db";

export default function HistoryPanel({
  onLoad,
  refreshKey,
}: {
  onLoad: (item: ResultRecord) => void;
  refreshKey: number;
}) {
  const [items, setItems] = useState<ResultRecord[]>([]);

  useEffect(() => {
    db.results
      .orderBy("createdAt")
      .reverse()
      .limit(10)
      .toArray()
      .then(setItems);
  }, [refreshKey]);

  async function remove(id?: number) {
    if (id == null) return;
    await db.results.delete(id);
    const arr = await db.results
      .orderBy("createdAt")
      .reverse()
      .limit(10)
      .toArray();
    setItems(arr);
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h2 className="text-sm font-semibold text-slate-200 mb-2">History</h2>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400">No items yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between text-xs bg-slate-950 p-2 rounded"
            >
              <span>
                {new Date(it.createdAt).toLocaleString()} · {it.source}
              </span>
              <div className="flex gap-2">
                <button
                  className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                  onClick={() => onLoad(it)}
                >
                  Load
                </button>
                <button
                  className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
                  onClick={() => remove(it.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
