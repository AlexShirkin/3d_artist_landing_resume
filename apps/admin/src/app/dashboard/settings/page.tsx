"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { fetchSettings, updateSettings, type SiteSettings } from "@/lib/api";

export default function SettingsPage() {
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchSettings().then(setForm).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMsg("");
    try {
      await updateSettings(form);
      setMsg("Сохранено");
    } catch {
      setMsg("Ошибка");
    } finally {
      setSaving(false);
    }
  }

  if (!form) {
    return (
      <AdminShell>
        <p className="text-muted">Загрузка…</p>
      </AdminShell>
    );
  }

  const fields: { key: keyof SiteSettings; label: string; rows?: number }[] = [
    { key: "designerName", label: "Имя на сайте" },
    { key: "tagline", label: "Подзаголовок (hero)" },
    { key: "bio", label: "О себе", rows: 5 },
    { key: "email", label: "Email" },
    { key: "telegram", label: "Telegram (@ или ссылка)" },
    { key: "instagram", label: "Instagram (@ или ссылка)" },
  ];

  return (
    <AdminShell>
      <h1 className="mb-6 text-2xl font-semibold">Настройки сайта</h1>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs text-muted">{f.label}</label>
            {f.rows ? (
              <textarea
                value={String(form[f.key])}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                rows={f.rows}
                className="w-full rounded px-3 py-2"
              />
            ) : (
              <input
                value={String(form[f.key])}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [f.key]:
                      f.key === "yearsExperience"
                        ? Number(e.target.value)
                        : e.target.value,
                  })
                }
                className="w-full rounded px-3 py-2"
              />
            )}
          </div>
        ))}
        <div>
          <label className="mb-1 block text-xs text-muted">Лет опыта</label>
          <input
            type="number"
            value={form.yearsExperience}
            onChange={(e) =>
              setForm({ ...form, yearsExperience: Number(e.target.value) })
            }
            className="w-32 rounded px-3 py-2"
          />
        </div>
        {msg && <p className="text-sm text-accent">{msg}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-accent px-6 py-2 font-medium text-bg disabled:opacity-50"
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </form>
    </AdminShell>
  );
}
