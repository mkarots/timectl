import React, { useState } from "react";
import { Box, Text, useInput } from "ink";

interface Props {
  hours: number;
  minutes: number;
  onChange: (hours: number, minutes: number) => void;
  isFocused: boolean;
}

export function TimePicker({ hours, minutes, onChange, isFocused }: Props) {
  const [segment, setSegment] = useState<"hours" | "minutes">("hours");

  useInput(
    (_input, key) => {
      if (key.leftArrow) {
        setSegment("hours");
        return;
      }
      if (key.rightArrow) {
        setSegment("minutes");
        return;
      }

      if (key.upArrow) {
        if (segment === "hours") {
          onChange(hours >= 23 ? 0 : hours + 1, minutes);
        } else {
          onChange(hours, minutes >= 59 ? 0 : minutes + 1);
        }
        return;
      }

      if (key.downArrow) {
        if (segment === "hours") {
          onChange(hours <= 0 ? 23 : hours - 1, minutes);
        } else {
          onChange(hours, minutes <= 0 ? 59 : minutes - 1);
        }
        return;
      }
    },
    { isActive: isFocused }
  );

  const hStr = hours.toString().padStart(2, "0");
  const mStr = minutes.toString().padStart(2, "0");

  if (!isFocused) {
    return (
      <Box>
        <Text dimColor>
          {hStr}:{mStr}
        </Text>
      </Box>
    );
  }

  const hoursActive = segment === "hours";
  const minutesActive = segment === "minutes";

  return (
    <Box>
      <Text inverse={hoursActive} color={hoursActive ? "cyan" : undefined}>
        {hStr}
      </Text>
      <Text>:</Text>
      <Text
        inverse={minutesActive}
        color={minutesActive ? "cyan" : undefined}
      >
        {mStr}
      </Text>
      <Text dimColor> ↑↓ change ←→ switch</Text>
    </Box>
  );
}
