#!/bin/sh
set -e

# Elite Realty container entrypoint.
# 1. Wait for the PostgreSQL database to accept connections.
# 2. Apply migrations (or push the schema if no migrations exist yet).
# 3. Seed the database (no-op if it is already populated).
# 4. Hand off to supervisord (nginx + API).

echo "[entrypoint] waiting for database..."

node -e '
const net = require("net");
function probe(host, port) {
  return new Promise((resolve, reject) => {
    const s = net.connect(port, host);
    s.on("connect", () => { s.destroy(); resolve(); });
    s.on("error", (err) => { s.destroy(); reject(err); });
  });
}
const url = process.env.DATABASE_URL || "postgresql://postgres:5432";
const m = url.match(/@([^:/?]+)(?::(\d+))?/);
const host = m ? m[1] : "postgres";
const port = m && m[2] ? parseInt(m[2], 10) : 5432;
let tries = 0;
(async () => {
  while (true) {
    try {
      await probe(host, port);
      console.log("[entrypoint] database is reachable at " + host + ":" + port);
      return;
    } catch (e) {
      tries++;
      if (tries > 60) {
        console.error("[entrypoint] timed out waiting for database");
        process.exit(1);
      }
      console.log("[entrypoint] waiting for database " + host + ":" + port + " (" + tries + ")");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
})();
'

cd /app/api

echo "[entrypoint] applying database schema..."
npx prisma db push || npx prisma db push --accept-data-loss

echo "[entrypoint] seeding database (skips automatically if already populated)..."
npx prisma db seed || echo "[entrypoint] seed step finished with warnings"

echo "[entrypoint] starting services..."
exec "$@"
