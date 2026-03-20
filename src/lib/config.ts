import { join } from "path";
import { homedir } from "os";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import type { Config } from "../types.ts";

const BASE_DIR = join(homedir(), ".timectl");
const CONFIG_PATH = join(BASE_DIR, "config.json");

const DEFAULT_CONFIG: Config = {
  categories: [
    "development",
    "it-support",
    "sync",
    "planning",
    "external-meeting",
  ],
};

export async function ensureConfig(): Promise<void> {
  if (!existsSync(BASE_DIR)) {
    await mkdir(BASE_DIR, { recursive: true });
  }
  if (!existsSync(CONFIG_PATH)) {
    await writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
  }
}

export async function loadConfig(): Promise<Config> {
  await ensureConfig();
  const raw = await readFile(CONFIG_PATH, "utf-8");
  return JSON.parse(raw) as Config;
}

export async function saveConfig(config: Config): Promise<void> {
  await ensureConfig();
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}
