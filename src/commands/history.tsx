import React from "react";
import { render } from "ink";
import { HistoryView } from "../components/HistoryView.tsx";

export async function historyCommand() {
  render(<HistoryView />);
}
