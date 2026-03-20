import React, { useState, useEffect } from "react";
import { Box, Text, useApp, useInput } from "ink";
import Spinner from "ink-spinner";
import { formatElapsed } from "../lib/format.ts";

interface Props {
  category: string;
  description: string;
  onStop: (elapsedSeconds: number) => void;
}

export function Timer({ category, description, onStop }: Props) {
  const [seconds, setSeconds] = useState(0);
  const { exit } = useApp();

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useInput((input, key) => {
    if (input === "q" || (key.ctrl && input === "c")) {
      onStop(seconds);
      exit();
    }
  });

  return (
    <Box flexDirection="column" gap={1}>
      <Box gap={1}>
        <Text color="green">
          <Spinner type="dots" />
        </Text>
        <Text bold color="white">
          {formatElapsed(seconds)}
        </Text>
      </Box>
      <Box gap={1}>
        <Text color="cyan" bold>
          [{category}]
        </Text>
        <Text>{description}</Text>
      </Box>
      <Text dimColor>Press Q to stop</Text>
    </Box>
  );
}
