export interface TimeEntry {
  id: string;
  category: string;
  description: string;
  startedAt: string;
  stoppedAt: string;
  durationMinutes: number;
}

export interface Config {
  categories: string[];
}
