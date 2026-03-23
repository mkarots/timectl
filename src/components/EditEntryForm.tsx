import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import SelectInput from "ink-select-input";
import type { TimeEntry } from "../types.ts";
import { TextInput } from "./TextInput.tsx";
import { TimePicker } from "./TimePicker.tsx";

interface Props {
  entry: TimeEntry;
  categories: string[];
  onSave: (updated: TimeEntry) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}

const FIELDS = [
  "category",
  "description",
  "started",
  "stopped",
  "buttons",
] as const;
type Field = (typeof FIELDS)[number];

const BUTTONS = ["save", "cancel", "delete"] as const;
type Button = (typeof BUTTONS)[number];

export function EditEntryForm({
  entry,
  categories,
  onSave,
  onCancel,
  onDelete,
}: Props) {
  // Field values
  const [category, setCategory] = useState(entry.category);
  const [description, setDescription] = useState(entry.description);
  const [startHours, setStartHours] = useState(
    new Date(entry.startedAt).getHours()
  );
  const [startMinutes, setStartMinutes] = useState(
    new Date(entry.startedAt).getMinutes()
  );
  const [stopHours, setStopHours] = useState(
    new Date(entry.stoppedAt).getHours()
  );
  const [stopMinutes, setStopMinutes] = useState(
    new Date(entry.stoppedAt).getMinutes()
  );

  // Focus management
  const [focusedField, setFocusedField] = useState<Field>("category");
  const [focusedButton, setFocusedButton] = useState<Button>("save");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmButton, setConfirmButton] = useState<"yes" | "no">("no");

  function moveFocus(direction: 1 | -1) {
    const currentIndex = FIELDS.indexOf(focusedField);
    const nextIndex =
      (currentIndex + direction + FIELDS.length) % FIELDS.length;
    setFocusedField(FIELDS[nextIndex]!);
  }

  function handleSave() {
    const startDate = new Date(entry.startedAt);
    startDate.setHours(startHours, startMinutes, 0, 0);

    const stopDate = new Date(entry.stoppedAt);
    stopDate.setHours(stopHours, stopMinutes, 0, 0);

    const durationMinutes =
      (stopDate.getTime() - startDate.getTime()) / 60000;

    onSave({
      ...entry,
      category,
      description,
      startedAt: startDate.toISOString(),
      stoppedAt: stopDate.toISOString(),
      durationMinutes: Math.round(durationMinutes * 100) / 100,
    });
  }

  function activateButton() {
    if (confirmDelete) {
      if (confirmButton === "yes") {
        onDelete(entry.id);
      } else {
        setConfirmDelete(false);
        setFocusedButton("delete");
      }
      return;
    }

    if (focusedButton === "save") {
      handleSave();
    } else if (focusedButton === "cancel") {
      onCancel();
    } else if (focusedButton === "delete") {
      setConfirmDelete(true);
      setConfirmButton("no");
    }
  }

  // Top-level input handler for Tab, Escape, and button navigation
  useInput(
    (input, key) => {
      if (key.escape) {
        if (confirmDelete) {
          setConfirmDelete(false);
          return;
        }
        onCancel();
        return;
      }

      if (key.tab) {
        if (key.shift) {
          moveFocus(-1);
        } else {
          moveFocus(1);
        }
        return;
      }

      // Button field navigation
      if (focusedField === "buttons") {
        if (confirmDelete) {
          if (key.leftArrow || key.rightArrow) {
            setConfirmButton((prev) => (prev === "yes" ? "no" : "yes"));
          }
          if (key.return) {
            activateButton();
          }
          return;
        }

        if (key.leftArrow) {
          const idx = BUTTONS.indexOf(focusedButton);
          setFocusedButton(BUTTONS[(idx - 1 + BUTTONS.length) % BUTTONS.length]!);
          return;
        }
        if (key.rightArrow) {
          const idx = BUTTONS.indexOf(focusedButton);
          setFocusedButton(BUTTONS[(idx + 1) % BUTTONS.length]!);
          return;
        }
        if (key.return) {
          activateButton();
          return;
        }
      }
    },
    { isActive: true }
  );

  const categoryItems = categories.map((c) => ({ label: c, value: c }));
  const initialCategoryIndex = Math.max(
    0,
    categories.indexOf(entry.category)
  );

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Text bold color="cyan">
        {" "}
        Edit Entry{" "}
      </Text>

      {/* Category */}
      <Box flexDirection="column" marginTop={1}>
        <Text
          bold
          color={focusedField === "category" ? "cyan" : "white"}
        >
          Category:
        </Text>
        <SelectInput
          items={categoryItems}
          isFocused={focusedField === "category"}
          initialIndex={initialCategoryIndex}
          limit={5}
          onSelect={(item) => setCategory(item.value)}
        />
      </Box>

      {/* Description */}
      <Box flexDirection="column" marginTop={1}>
        <Text
          bold
          color={focusedField === "description" ? "cyan" : "white"}
        >
          Description:
        </Text>
        <TextInput
          value={description}
          onChange={setDescription}
          isFocused={focusedField === "description"}
        />
      </Box>

      {/* Started */}
      <Box marginTop={1} gap={2}>
        <Text
          bold
          color={focusedField === "started" ? "cyan" : "white"}
        >
          Started:
        </Text>
        <TimePicker
          hours={startHours}
          minutes={startMinutes}
          onChange={(h, m) => {
            setStartHours(h);
            setStartMinutes(m);
          }}
          isFocused={focusedField === "started"}
        />
      </Box>

      {/* Stopped */}
      <Box gap={2}>
        <Text
          bold
          color={focusedField === "stopped" ? "cyan" : "white"}
        >
          Stopped:
        </Text>
        <TimePicker
          hours={stopHours}
          minutes={stopMinutes}
          onChange={(h, m) => {
            setStopHours(h);
            setStopMinutes(m);
          }}
          isFocused={focusedField === "stopped"}
        />
      </Box>

      {/* Buttons */}
      <Box marginTop={1} gap={2}>
        {confirmDelete ? (
          <>
            <Text color="red" bold>
              Delete this entry?
            </Text>
            <Text
              inverse={confirmButton === "yes"}
              color="red"
            >
              [Yes]
            </Text>
            <Text inverse={confirmButton === "no"}>[No]</Text>
          </>
        ) : (
          <>
            <Text
              inverse={
                focusedField === "buttons" && focusedButton === "save"
              }
              color="green"
            >
              [Save]
            </Text>
            <Text
              inverse={
                focusedField === "buttons" && focusedButton === "cancel"
              }
            >
              [Cancel]
            </Text>
            <Text
              inverse={
                focusedField === "buttons" && focusedButton === "delete"
              }
              color="red"
            >
              [Delete]
            </Text>
          </>
        )}
      </Box>

      {/* Hint bar */}
      <Box marginTop={1}>
        <Text dimColor>Tab: Next field  Shift+Tab: Previous  Esc: Cancel</Text>
      </Box>
    </Box>
  );
}
