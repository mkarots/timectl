import { getEntries, getEntriesRange } from "../lib/storage.ts";
import { formatDuration, startOfWeek, startOfMonth, formatDate } from "../lib/format.ts";
import type { TimeEntry } from "../types.ts";

function aggregateByCategory(entries: TimeEntry[]) {
  const map = new Map<string, number>();
  let total = 0;
  for (const e of entries) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.durationMinutes);
    total += e.durationMinutes;
  }
  return { map, total };
}

function getDateRange(
  period: string,
  dateStr?: string
): { from: Date; to: Date } {
  const base = dateStr ? new Date(dateStr) : new Date();
  if (period === "day") {
    return { from: base, to: base };
  } else if (period === "week") {
    return { from: startOfWeek(base), to: base };
  } else {
    return { from: startOfMonth(base), to: base };
  }
}

export async function exportCommand(options: {
  period: string;
  date?: string;
  format: string;
}) {
  const { from, to } = getDateRange(options.period, options.date);
  const entries =
    options.period === "day"
      ? await getEntries(from)
      : await getEntriesRange(from, to);

  if (options.format === "json") {
    const { map, total } = aggregateByCategory(entries);
    const output = {
      period: options.period,
      from: formatDate(from),
      to: formatDate(to),
      totalMinutes: total,
      totalFormatted: formatDuration(total),
      categories: Object.fromEntries(
        [...map.entries()].map(([cat, mins]) => [
          cat,
          {
            minutes: mins,
            formatted: formatDuration(mins),
            percentage: total > 0 ? Math.round((mins / total) * 100) : 0,
          },
        ])
      ),
      entries: entries.map((e) => ({
        ...e,
        durationFormatted: formatDuration(e.durationMinutes),
      })),
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    const { map, total } = aggregateByCategory(entries);
    const lines: string[] = [];
    lines.push(
      `# Time Report: ${options.period} (${formatDate(from)} → ${formatDate(to)})`
    );
    lines.push("");
    lines.push(`**Total tracked:** ${formatDuration(total)}`);
    lines.push("");
    lines.push("| Category | Time | % |");
    lines.push("|----------|------|---|");
    for (const [cat, mins] of [...map.entries()].sort((a, b) => b[1] - a[1])) {
      const pct = total > 0 ? Math.round((mins / total) * 100) : 0;
      lines.push(`| ${cat} | ${formatDuration(mins)} | ${pct}% |`);
    }
    lines.push("");
    lines.push("## Entries");
    lines.push("");
    for (const e of entries) {
      const time = new Date(e.startedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      lines.push(
        `- ${time} **[${e.category}]** ${e.description} (${formatDuration(e.durationMinutes)})`
      );
    }
    console.log(lines.join("\n"));
  }
}
