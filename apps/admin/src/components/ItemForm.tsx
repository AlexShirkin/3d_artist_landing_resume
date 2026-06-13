"use client";

import { useState } from "react";
import {
  createItem,
  updateItem,
  uploadFile,
  type PortfolioItem,
} from "@/lib/api";

interface ItemFormProps {
  item?: PortfolioItem;
  onSaved: () => void;
  onCancel: () => void;
}

export function ItemForm({ item, onSaved, onCancel }: ItemFormProps) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [category, setCategory] = useState(item?.category ?? "general");
  const [mediaType, setMediaType] = useState<"video" | "gif" | "image">(
    item?.mediaType ?? "video"
  );
  const [mediaUrl, setMediaUrl] = useState(item?.mediaUrl ?? "");
  const [featured, setFeatured] = useState(item?.featured ?? false);
  const [sortOrder, setSortOrder] = useState(item?.sortOrder ?? 0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const { url } = await uploadFile(file);
      setMediaUrl(url);
      const ext = file.name.toLowerCase();
      if (ext.endsWith(".gif")) setMediaType("gif");
      else if (/\.(mp4|webm|mov)$/.test(ext)) setMediaType("video");
      else setMediaType("image");
    } catch {
      setError("Не удалось загрузить файл");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mediaUrl) {
      setError("Загрузите медиафайл");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (item) {
        await updateItem(item.id, {
          title,
          description,
          category,
          mediaType,
          mediaUrl,
          featured,
          sortOrder,
        });
      } else {
        await createItem({
          title,
          description,
          category,
          mediaType,
          mediaUrl,
          featured,
          sortOrder,
        });
      }
      onSaved();
    } catch {
      setError("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-surface p-6">
      <h2 className="text-lg font-medium">{item ? "Редактировать" : "Новая работа"}</h2>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-muted">Название</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Категория</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded px-3 py-2"
            placeholder="платья, костюмы…"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded px-3 py-2"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-muted">Тип медиа</label>
          <select
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as "video" | "gif" | "image")}
            className="w-full rounded px-3 py-2"
          >
            <option value="video">Видео</option>
            <option value="gif">GIF</option>
            <option value="image">Изображение</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Порядок</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="w-full rounded px-3 py-2"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">В избранном</span>
          </label>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Файл (видео / gif / фото)</label>
        <input type="file" accept="video/*,image/*,.gif" onChange={handleFile} />
        {uploading && <p className="mt-1 text-sm text-muted">Загрузка…</p>}
        {mediaUrl && (
          <p className="mt-1 text-xs text-accent truncate">{mediaUrl}</p>
        )}
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-accent px-6 py-2 font-medium text-bg disabled:opacity-50"
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-border px-6 py-2 text-muted hover:text-text"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
