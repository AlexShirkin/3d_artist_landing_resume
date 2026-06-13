import Fastify from "fastify";
import cors from "@fastify/cors";
import proxy from "@fastify/http-proxy";
import jwt from "jsonwebtoken";

const PORT = Number(process.env.PORT) || 4000;
const PORTFOLIO_URL = process.env.PORTFOLIO_URL || "http://localhost:3001";
const AUTH_URL = process.env.AUTH_URL || "http://localhost:3002";
const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

function verifyToken(auth?: string): boolean {
  if (!auth?.startsWith("Bearer ")) return false;
  try {
    jwt.verify(auth.slice(7), JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

app.get("/health", async () => ({ status: "ok", service: "gateway" }));

// Static uploads (videos, images)
await app.register(proxy, {
  upstream: PORTFOLIO_URL,
  prefix: "/uploads",
  rewritePrefix: "/uploads",
});

// Public read-only portfolio API
await app.register(proxy, {
  upstream: PORTFOLIO_URL,
  prefix: "/api/portfolio",
  rewritePrefix: "/",
});

// Auth (login, verify)
await app.register(proxy, {
  upstream: AUTH_URL,
  prefix: "/api/auth",
  rewritePrefix: "/",
});

// Admin mutations — require JWT
app.addHook("onRequest", async (req, reply) => {
  if (!req.url.startsWith("/api/admin")) return;
  const isRead = req.method === "GET";
  if (isRead) return;
  if (!verifyToken(req.headers.authorization)) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
});

await app.register(proxy, {
  upstream: PORTFOLIO_URL,
  prefix: "/api/admin",
  rewritePrefix: "/",
});

await app.listen({ port: PORT, host: "0.0.0.0" });
