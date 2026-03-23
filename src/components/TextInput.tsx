import React from "react";
import { Text, useInput } from "ink";

interface Props {
  value: string;
  onChange: (value: string) => void;
  isFocused: boolean;
}

export function TextInput({ value, onChange, isFocused }: Props) {
  useInput(
    (input, key) => {
      if (key.backspace || key.delete) {
        onChange(value.slice(0, -1));
        return;
      }

      // Only accept printable characters
      if (input && !key.ctrl && !key.meta) {
        onChange(value + input);
      }
    },
    { isActive: isFocused }
  );

  if (isFocused) {
    return (
      <Text>
        {value}
        <Text inverse> </Text>
      </Text>
    );
  }

  return <Text dimColor={!value}>{value || "(empty)"}</Text>;
}
