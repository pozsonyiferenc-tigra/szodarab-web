import type { NextConfig } from "next";
import { execSync } from "node:child_process";

// ── Verzió-infó build-időben, automatikusan ──────────────────
// A dátum a build napja (Europe/Budapest), a "verziószám" a git
// commit rövid SHA-ja. Vercelen a VERCEL_GIT_COMMIT_SHA-ból, lokálisan
// git parancsból. NINCS kézi teendő – minden deploy magától friss.
const buildDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Budapest",
}).format(new Date()); // → "YYYY-MM-DD"

let commitSha = (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7);
if (!commitSha) {
  try {
    commitSha = execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    commitSha = "helyi";
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_DATE: buildDate,
    NEXT_PUBLIC_BUILD_SHA: commitSha,
  },
};

export default nextConfig;
