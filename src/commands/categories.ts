import { loadConfig, saveConfig } from "../lib/config.ts";

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
