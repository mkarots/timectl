import { loadConfig, saveConfig } from "../lib/config.ts";
import { migrateCategoryInAllDayFiles } from "../lib/storage.ts";

export async function listCategories() {
  const config = await loadConfig();
  console.log("Categories:");
  for (const c of config.categories) {
    console.log(`  • ${c}`);
  }
}

export async function addCategory(name: string) {
  const config = await loadConfig();
  if (config.categories.includes(name)) {
    console.log(`Category "${name}" already exists.`);
    return;
  }
  config.categories.push(name);
  await saveConfig(config);
  console.log(`Added category "${name}".`);
}

export async function removeCategory(name: string) {
  const config = await loadConfig();
  const idx = config.categories.indexOf(name);
  if (idx === -1) {
    console.log(`Category "${name}" not found.`);
    return;
  }
  config.categories.splice(idx, 1);
  await saveConfig(config);
  console.log(`Removed category "${name}".`);
}

export async function migrateCategory(from: string, to: string) {
  if (from === to) {
    console.log("Source and target categories are the same; nothing to do.");
    return;
  }

  const { filesChanged, entriesUpdated } = await migrateCategoryInAllDayFiles(
    from,
    to
  );

  const config = await loadConfig();
  if (!config.categories.includes(to)) {
    config.categories.push(to);
  }
  const fromIdx = config.categories.indexOf(from);
  if (fromIdx !== -1) {
    config.categories.splice(fromIdx, 1);
  }
  await saveConfig(config);

  console.log(
    `Migrated category "${from}" → "${to}": ${entriesUpdated} entr${entriesUpdated === 1 ? "y" : "ies"} in ${filesChanged} file${filesChanged === 1 ? "" : "s"}. Config updated.`
  );
}
