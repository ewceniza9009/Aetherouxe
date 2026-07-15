// Lightweight end-to-end smoke test for the running Elite Realty stack.
//
// Strategy: validate nginx via /health (port 80), then exercise the API
// directly (port 4000) so the test does not depend on vhost Host-header
// routing. Run inside the app container:
//   docker cp scripts/smoke.mjs elite-app:/tmp/smoke.mjs
//   docker exec elite-app node /tmp/smoke.mjs
// Override targets if needed:
//   SMOKE_NGINX=http://127.0.0.1:80 SMOKE_API=http://127.0.0.1:4000 node scripts/smoke.mjs

const NGINX = process.env.SMOKE_NGINX || "http://127.0.0.1:80";
const API = process.env.SMOKE_API || "http://127.0.0.1:4000";
const V1 = API + "/api/v1";

async function call(base, path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

let failures = 0;
function check(name, cond, detail) {
  if (cond) console.log(`PASS  ${name}`);
  else {
    console.log(`FAIL  ${name} :: ${detail}`);
    failures++;
  }
}
const okStatus = (s) => s === 200 || s === 201;

(async () => {
  const h = await call(NGINX, "/health");
  const healthBody = typeof h.data === "string" ? h.data.trim() : "";
  check("nginx GET /health", h.status === 200 && healthBody === "healthy", `status ${h.status} body="${healthBody}"`);

  const admin = await call(V1, "/auth/login", {
    method: "POST",
    body: { email: "admin@elite-realty.com", password: "Admin123!" },
  });
  const adminToken = admin.data?.data?.accessToken;
  check("admin login", okStatus(admin.status) && !!adminToken, `status ${admin.status}`);

  const settings = await call(V1, "/settings/company", { token: adminToken });
  check(
    "authed GET /settings/company",
    settings.status === 200 && !!settings.data?.data?.company?.tradeName,
    `status ${settings.status}`,
  );

  const resident = await call(V1, "/auth/login", {
    method: "POST",
    body: { email: "resident1@elite-realty.com", password: "Tenant123!" },
  });
  check("resident login (multi-role auth)", okStatus(resident.status) && !!resident.data?.data?.accessToken, `status ${resident.status}`);

  const owner = await call(V1, "/auth/login", {
    method: "POST",
    body: { email: "owner1@elite-realty.com", password: "Owner123!" },
  });
  check("owner login (multi-role auth)", okStatus(owner.status) && !!owner.data?.data?.accessToken, `status ${owner.status}`);

  if (failures === 0) {
    console.log("\nSMOKE TEST PASSED");
    process.exit(0);
  }
  console.log(`\nSMOKE TEST FAILED (${failures} check(s))`);
  process.exit(1);
})();
