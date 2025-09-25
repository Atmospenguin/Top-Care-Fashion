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

process.env.NODE_ENV = process.env.NODE_ENV || "test";
