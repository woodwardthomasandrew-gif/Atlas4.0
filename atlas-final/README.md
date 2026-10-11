# Alaruel Atlas

Alaruel Atlas is an offline desktop workshop for creating tabletop role-playing game assets and arranging them for print. It is built with Electron, React, and TypeScript. Creatures, spells, magic items, reusable traits, and print layouts are saved locally in a SQLite database. The app does not require an account or network connection to use.

## What you can do

- Create and manage creature stat blocks, spells, and magic items. Search and duplicate saved assets, then export them as JSON or Markdown.
- Build reusable traits and drag them into creature stat blocks or print layouts.
- Lay out cards on US Letter or A4 pages in Print Studio, including multi-page creature cards. Export a PDF or open it in your system PDF viewer to print.
- Create in-world letters, notices, posters, and other printable documents in Handout Studio. Start from a blank page or a built-in design, then edit text, shapes, artwork, and paper effects.
- Start creature, spell, and magic-item assets from reusable templates, then customize and save them as ordinary library assets.
- Use dark or light themes, keyboard shortcuts, undo and redo, and configurable autosave.

## Install and run

### Use the Windows installer

Build the Windows NSIS installer with `npm run dist`. The installer is interactive, supports choosing an installation directory, and can create Start Menu and desktop shortcuts. Packaged output is written to `release/`.

### Run from source

Requirements: Node.js 18 or newer and npm.

```powershell
npm install
npm run dev
```

The development command compiles the Electron main process, starts the Vite renderer server, then launches the desktop app with developer tools open.

To build the app bundles without creating an installer:

```powershell
npm run build
npm start
```

To build the Windows installer:

```powershell
npm run dist
```

`npm start` expects a previous build. `npm run dist` runs the build and packages a Windows NSIS installer using electron-builder.

See [Development](docs/DEVELOPMENT.md) for scripts, layout, and extension points. See the [User Guide](docs/USER_GUIDE.md) for asset and print workflows.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Compile Electron and run Vite plus Electron for development |
| `npm run vite:dev` | Run only the Vite renderer server |
| `npm run build` | Type-check/build the renderer and compile Electron |
| `npm run dist` | Build and package the Windows NSIS installer in `release/` |
| `npm run start` | Launch the built Electron app |
| `npm run typecheck` | Type-check renderer and Electron projects |
| `npm run lint` | Run ESLint on TypeScript files |
| `npm test` | Run the Vitest suite |

## Local data

The database file is `atlas.db` under Electron's per-user `userData` directory. Its exact location depends on the Windows account and Electron's resolved application data path. Back up the database file with the app closed to preserve your work. Atlas stores asset records, settings, and reusable components in this database; artwork is stored with its asset data.

## Project overview

```text
electron/       Electron main process, secure preload bridge, SQLite persistence
src/app/        Shared registries, database stores, routing, settings, themes, shortcuts
src/ui/         Shared shell and UI components
src/pages/      Dashboard and settings
src/plugins/    Creature, spell, magic item, trait, Print Studio, and Handout Studio features
docs/           User and development guides
```

The renderer runs with context isolation enabled, Node integration disabled, and sandboxing enabled. Renderer persistence and app actions go through the narrow API exposed by `electron/preload.ts`. Plugin registrations are loaded centrally in `src/app/registry/loadPlugins.ts`; plugins contribute asset types, navigation, and routes to shared registries.

## Documentation

- [User Guide](docs/USER_GUIDE.md)
- [Handout Studio](docs/handout-studio.md)
- [Development](docs/DEVELOPMENT.md)

