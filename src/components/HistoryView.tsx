import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import type { TimeEntry } from "../types.ts";
import { getEntries, getEntriesRange } from "../lib/storage.ts";
import { formatDuration, startOfWeek, startOfMonth } from "../lib/format.ts";

const TABS = ["Today", "This Week", "This Month"] as const;
type Tab = (typeof TABS)[number];

function aggregateByCategory(entries: TimeEntry[]) {
  const map = new Map<string, number>();
  let total = 0;
  for (const e of entries) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.durationMinutes);
    total += e.durationMinutes;
  }
  return { map, total };
}

export function HistoryView() {
  const [tabIndex, setTabIndex] = useState(0);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const currentTab = TABS[tabIndex]!;

  useInput((_input, key) => {
    if (key.rightArrow) setTabIndex((i) => Math.min(i + 1, TABS.length - 1));
    if (key.leftArrow) setTabIndex((i) => Math.max(i - 1, 0));
  });

  useEffect(() => {
    setLoading(true);
    const now = new Date();

    let promise: Promise<TimeEntry[]>;
    if (currentTab === "Today") {
      promise = getEntries(now);
    } else if (currentTab === "This Week") {
      promise = getEntriesRange(startOfWeek(now), now);
    } else {
      promise = getEntriesRange(startOfMonth(now), now);
    }

    promise.then((e) => {
      setEntries(e);
      setLoading(false);
    });
  }, [currentTab]);

  const { map, total } = aggregateByCategory(entries);

  return (
    <Box flexDirection="column" gap={1}>
      {/* Tab bar */}
      <Box gap={2}>
        {TABS.map((tab, i) => (
          <Text
            key={tab}
            bold={i === tabIndex}
            color={i === tabIndex ? "cyan" : "gray"}
            underline={i === tabIndex}
          >
            {tab}
          </Text>
        ))}
        <Text dimColor>← → to switch tabs</Text>
      </Box>

      {loading ? (
        <Text dimColor>Loading...</Text>
      ) : entries.length === 0 ? (
        <Text dimColor>No entries for this period.</Text>
      ) : (
        <Box flexDirection="column">
          {/* Summary table */}
          <Box flexDirection="column">
            <Box gap={2}>
              <Text bold color="white">
                {"Category".padEnd(20)}
              </Text>
              <Text bold color="white">
                {"Time".padEnd(10)}
              </Text>
              <Text bold color="white">
                {"%"}
              </Text>
            </Box>
            <Text>{"─".repeat(40)}</Text>
            {[...map.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([cat, mins]) => (
                <Box key={cat} gap={2}>
                  <Text color="cyan">{cat.padEnd(20)}</Text>
                  <Text>{formatDuration(mins).padEnd(10)}</Text>
                  <Text dimColor>
                    {total > 0
                      ? `${Math.round((mins / total) * 100)}%`
                      : "0%"}
                  </Text>
                </Box>
              ))}
            <Text>{"─".repeat(40)}</Text>
            <Box gap={2}>
              <Text bold>{"Total".padEnd(20)}</Text>
              <Text bold>{formatDuration(total)}</Text>
            </Box>
          </Box>

          {/* Entry list */}
          <Box flexDirection="column" marginTop={1}>
            <Text bold underline>
              Entries
            </Text>
            {entries.map((e) => (
              <Box key={e.id} gap={1}>
                <Text dimColor>
                  {new Date(e.startedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Text color="cyan">[{e.category}]</Text>
                <Text>{e.description}</Text>
                <Text dimColor>({formatDuration(e.durationMinutes)})</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
