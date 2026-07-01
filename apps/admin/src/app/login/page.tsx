"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("expired") === "1") {
      setError("Сессия истекла. Войдите снова.");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await login(email, password);
      setToken(token);
      router.push("/dashboard");
    } catch {
      setError("Неверный email или пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-lg border border-border bg-surface p-8"
      >
        <div>
          <h1 className="text-2xl font-semibold text-text">Админка портфолио</h1>
          <p className="mt-2 text-sm text-muted">Войдите для управления работами</p>
        </div>
        {error && (
          <p className="rounded bg-danger/10 px-4 py-2 text-sm text-danger">{error}</p>
        )}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wider text-muted">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded px-4 py-3"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-wider text-muted">
            Пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded px-4 py-3"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-accent py-3 font-medium text-bg transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Вход…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
