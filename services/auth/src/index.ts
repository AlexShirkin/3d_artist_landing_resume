import Fastify from "fastify";
import cors from "@fastify/cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";

const PORT = Number(process.env.PORT) || 3002;
const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@portfolio.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://cloth:cloth_secret@localhost:5432/cloth_portfolio",
});

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

async function ensureAdminUser() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const { rows } = await pool.query("SELECT id FROM admin_users WHERE email = $1", [
    ADMIN_EMAIL,
  ]);
  if (rows.length === 0) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await pool.query(
      "INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)",
      [ADMIN_EMAIL, hash]
    );
    app.log.info(`Admin user created: ${ADMIN_EMAIL}`);
  }
}

await ensureAdminUser();

app.get("/health", async () => ({ status: "ok", service: "auth" }));

app.post("/login", async (req, reply) => {
  const { email, password } = req.body as { email: string; password: string };
  const { rows } = await pool.query<{ id: string; email: string; password_hash: string }>(
    "SELECT id, email, password_hash FROM admin_users WHERE email = $1",
    [email]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return reply.status(401).send({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
  return { token, user: { id: user.id, email: user.email } };
});

app.get("/verify", async (req, reply) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as {
      sub: string;
      email: string;
    };
    return { valid: true, user: { id: payload.sub, email: payload.email } };
  } catch {
    return reply.status(401).send({ error: "Invalid token" });
  }
});

await app.listen({ port: PORT, host: "0.0.0.0" });
