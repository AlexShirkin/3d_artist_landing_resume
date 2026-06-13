"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { ItemForm } from "@/components/ItemForm";
import {
  deleteItem,
  fetchItems,
  mediaSrc,
  type PortfolioItem,
} from "@/lib/api";

export default function DashboardPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await fetchItems());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm("Удалить эту работу?")) return;
    await deleteItem(id);
    load();
  }

  return (
    <AdminShell>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Работы портфолио</h1>
        {!creating && !editing && (
          <button
            onClick={() => setCreating(true)}
            className="rounded bg-accent px-5 py-2 text-sm font-medium text-bg"
          >
            + Добавить
          </button>
        )}
      </div>

      {(creating || editing) && (
        <div className="mb-8">
          <ItemForm
            item={editing ?? undefined}
            onSaved={() => {
              setCreating(false);
              setEditing(null);
              load();
            }}
            onCancel={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      {loading ? (
        <p className="text-muted">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="text-muted">Пока нет работ. Добавьте первую.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center"
            >
              <div className="h-24 w-20 shrink-0 overflow-hidden rounded bg-bg">
                {item.mediaType === "video" ? (
                  <video
                    src={mediaSrc(item.mediaUrl)}
                    className="h-full w-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={mediaSrc(item.mediaUrl)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{item.title}</span>
                  {item.featured && (
                    <span className="rounded bg-accent/20 px-2 py-0.5 text-xs text-accent">
                      избранное
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted">
                  {item.category} · {item.mediaType} · порядок {item.sortOrder}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCreating(false);
                    setEditing(item);
                  }}
                  className="rounded border border-border px-4 py-2 text-sm hover:border-accent"
                >
                  Изменить
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded border border-danger/30 px-4 py-2 text-sm text-danger hover:bg-danger/10"
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
