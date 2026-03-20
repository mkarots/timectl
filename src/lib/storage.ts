import { join } from "path";
import { homedir } from "os";
import { readFile, writeFile, mkdir, readdir } from "fs/promises";
import { existsSync } from "fs";
import type { TimeEntry } from "../types.ts";

const DATA_DIR = join(homedir(), ".timectl", "data");

function dayFilePath(date: Date): string {
  const y = date.getFullYear().toString();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return join(DATA_DIR, y, m, `${d}.json`);
}

export async function saveEntry(entry: TimeEntry): Promise<void> {
  const date = new Date(entry.startedAt);
  const filePath = dayFilePath(date);
  const dir = join(filePath, "..");

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  let entries: TimeEntry[] = [];
  if (existsSync(filePath)) {
    const raw = await readFile(filePath, "utf-8");
    entries = JSON.parse(raw) as TimeEntry[];
  }

  entries.push(entry);
  await writeFile(filePath, JSON.stringify(entries, null, 2));
}

export async function getEntries(date: Date): Promise<TimeEntry[]> {
  const filePath = dayFilePath(date);
  if (!existsSync(filePath)) return [];
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as TimeEntry[];
}

export async function getEntriesRange(
  from: Date,
  to: Date
): Promise<TimeEntry[]> {
  const entries: TimeEntry[] = [];
  const current = new Date(from);
  current.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const dayEntries = await getEntries(current);
    entries.push(...dayEntries);
    current.setDate(current.getDate() + 1);
  }

  return entries;
}

export async function getRecentEntries(days: number = 30): Promise<TimeEntry[]> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return getEntriesRange(from, to);
}

export async function migrateCategoryInAllDayFiles(
  from: string,
  to: string
): Promise<{ filesChanged: number; entriesUpdated: number }> {
  let filesChanged = 0;
  let entriesUpdated = 0;

  if (!existsSync(DATA_DIR)) {
    return { filesChanged, entriesUpdated };
  }

  const yearEntries = await readdir(DATA_DIR, { withFileTypes: true });
  for (const yEnt of yearEntries) {
    if (!yEnt.isDirectory()) continue;
    const yPath = join(DATA_DIR, yEnt.name);
    const monthEntries = await readdir(yPath, { withFileTypes: true });
    for (const mEnt of monthEntries) {
      if (!mEnt.isDirectory()) continue;
      const mPath = join(yPath, mEnt.name);
      const dayFiles = await readdir(mPath, { withFileTypes: true });
      for (const fEnt of dayFiles) {
        if (!fEnt.isFile() || !fEnt.name.endsWith(".json")) continue;
        const filePath = join(mPath, fEnt.name);
        let raw: string;
        try {
          raw = await readFile(filePath, "utf-8");
        } catch {
          continue;
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          console.warn(`timectl: skipping invalid JSON: ${filePath}`);
          continue;
        }
        if (!Array.isArray(parsed)) {
          console.warn(`timectl: skipping non-array JSON: ${filePath}`);
          continue;
        }
        const entries = parsed as TimeEntry[];
        let fileDirty = false;
        for (const entry of entries) {
          if (entry?.category === from) {
            entry.category = to;
            fileDirty = true;
            entriesUpdated += 1;
          }
        }
        if (fileDirty) {
          await writeFile(filePath, JSON.stringify(entries, null, 2));
          filesChanged += 1;
        }
      }
    }
  }

  return { filesChanged, entriesUpdated };
}
