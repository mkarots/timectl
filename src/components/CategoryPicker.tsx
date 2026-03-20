import React from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";

interface Props {
  categories: string[];
  onSelect: (category: string) => void;
}

export function CategoryPicker({ categories, onSelect }: Props) {
  const items = categories.map((c) => ({ label: c, value: c }));

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Select a category:
      </Text>
      <SelectInput
        items={items}
        onSelect={(item) => onSelect(item.value)}
      />
    </Box>
  );
}
