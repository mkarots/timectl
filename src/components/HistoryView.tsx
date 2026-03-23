import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";
import type { TimeEntry } from "../types.ts";
import {
  getEntries,
  getEntriesRange,
  updateEntry,
  deleteEntry,
} from "../lib/storage.ts";
import { formatDuration, startOfWeek, startOfMonth } from "../lib/format.ts";
import { loadConfig } from "../lib/config.ts";
import { EditEntryForm } from "./EditEntryForm.tsx";

const TABS = ["Today", "Yesterday", "This Week", "This Month"] as const;
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
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(0);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const { exit } = useApp();

  const currentTab = TABS[tabIndex]!;

  // Load categories on mount
  useEffect(() => {
    loadConfig().then((config) => setCategories(config.categories));
  }, []);

  // Load entries for current tab
  const loadEntries = useCallback(async () => {
    setLoading(true);
    const now = new Date();

    let result: TimeEntry[];
    if (currentTab === "Today") {
      result = await getEntries(now);
    } else if (currentTab === "Yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      result = await getEntries(y);
    } else if (currentTab === "This Week") {
      result = await getEntriesRange(startOfWeek(now), now);
    } else {
      result = await getEntriesRange(startOfMonth(now), now);
    }

    setEntries(result);
    setLoading(false);
  }, [currentTab]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Reset selection when tab changes
  useEffect(() => {
    setSelectedEntryIndex(0);
  }, [currentTab]);

  // Clamp selection when entries shrink
  useEffect(() => {
    if (selectedEntryIndex >= entries.length && entries.length > 0) {
      setSelectedEntryIndex(entries.length - 1);
    }
  }, [entries.length, selectedEntryIndex]);

  // History view keyboard handler — disabled during editing
  useInput(
    (input, key) => {
      if (key.escape || input.toLowerCase() === "q") {
        exit();
        return;
      }
      if (key.rightArrow)
        setTabIndex((i) => Math.min(i + 1, TABS.length - 1));
      if (key.leftArrow) setTabIndex((i) => Math.max(i - 1, 0));

      // Entry navigation
      if (key.upArrow)
        setSelectedEntryIndex((i) => Math.max(i - 1, 0));
      if (key.downArrow)
        setSelectedEntryIndex((i) =>
          Math.min(i + 1, entries.length - 1)
        );

      // Open edit
      if (
        (input.toLowerCase() === "e" || key.return) &&
        entries.length > 0
      ) {
        setEditingEntry(entries[selectedEntryIndex] ?? null);
      }
    },
    { isActive: editingEntry === null }
  );

  // Edit callbacks
  const handleSave = async (updated: TimeEntry) => {
    await updateEntry(updated);
    setEditingEntry(null);
    await loadEntries();
  };

  const handleCancel = () => {
    setEditingEntry(null);
  };

  const handleDelete = async (id: string) => {
    const date = new Date(editingEntry!.startedAt);
    await deleteEntry(id, date);
    setEditingEntry(null);
    await loadEntries();
  };

  // Render edit form when editing
  if (editingEntry) {
    return (
      <EditEntryForm
        entry={editingEntry}
        categories={categories}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />
    );
  }

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
            {entries.map((e, index) => (
              <Box key={e.id} gap={1}>
                <Text color={index === selectedEntryIndex ? "cyan" : undefined}>
                  {index === selectedEntryIndex ? "►" : " "}
                </Text>
                <Text dimColor={index !== selectedEntryIndex}>
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

      <Box marginTop={1}>
        <Text dimColor>↑↓: Select  E/Enter: Edit  ←→: Tabs  Q: Quit</Text>
      </Box>
    </Box>
  );
}
