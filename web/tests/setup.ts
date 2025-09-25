import { config as loadEnv } from "dotenv";
import { existsSync } from "fs";
import path from "path";

const cwd = process.cwd();
const envLocal = path.join(cwd, ".env.local");
if (existsSync(envLocal)) {
  loadEnv({ path: envLocal });
}

const envFile = path.join(cwd, ".env");
if (existsSync(envFile)) {
  loadEnv({ path: envFile, override: true });
}

// `process.env` properties are readonly in some TypeScript configurations / runtimes.
// Use a safe assignment via type assertion so builds that compile `process.env` as
// readonly won't fail.
if (!process.env.NODE_ENV) {
  (process.env as Record<string, string | undefined>).NODE_ENV = "test";
}
