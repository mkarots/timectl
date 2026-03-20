# timectl — Agent Instructions

## Project Overview
A personal CLI time tracker built with Bun + TypeScript + Ink (React for CLI). Single-user, local-only, no database.

## Architecture

```
src/
  index.ts              # CLI entry point (Commander setup)
  types.ts              # Shared types: TimeEntry, Config
  commands/             # CLI command handlers (wire UI + domain logic)
    start.tsx           # Interactive category picker → timer
    resume.tsx          # Pick recent task → timer
    history.tsx         # Tabbed period view
    export.ts           # JSON/markdown output to stdout
    categories.ts       # CRUD for categories
  components/           # Reusable Ink (React) UI components
    Timer.tsx           # Animated timer with spinner + Q to stop
    CategoryPicker.tsx  # Interactive category selector
    HistoryView.tsx     # Tabbed Today/Week/Month view
  lib/                  # Domain logic (no UI)
    storage.ts          # Read/write day JSON files (~/.timectl/data/YYYY/MM/DD.json)
    config.ts           # Read/write config (~/.timectl/config.json)
    format.ts           # Duration/date formatting helpers
```

## Key Conventions
- **Runtime**: Always use Bun. Never Node.js, npm, or npx.
- **No database**: Storage is flat JSON files organized by date.
- **Components vs Commands**: Components are reusable Ink React components. Commands are CLI entry points that compose components and call into `lib/`.
- **Types**: All shared types live in `src/types.ts`.

## Building & Running
- Dev: `bun run src/index.ts <command>`
- Bundle: `bun run bundle` (compiles to single binary at `/usr/local/bin/timectl`)
- After bundling: `timectl <command>` from anywhere

## Storage Location
- Config: `~/.timectl/config.json`
- Data: `~/.timectl/data/YYYY/MM/DD.json`

## Adding a New Command
1. Create handler in `src/commands/`
2. If it needs UI, create component in `src/components/`
3. Register the command in `src/index.ts` via Commander
4. Update SPEC.md with the new command docs
