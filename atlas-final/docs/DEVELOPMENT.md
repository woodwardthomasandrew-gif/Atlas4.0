# Development

## Requirements and setup

- Node.js 18 or newer
- npm

```powershell
npm install
npm run dev
```

`npm run dev` compiles the Electron main process, starts Vite on port 5173, waits for it, and launches Electron in development mode. Developer tools open with the development window.

## Build and package

```powershell
npm run typecheck
npm run build
npm start
```

`build` creates the Vite renderer in `dist/` and compiles the Electron main process into `dist-electron/`. `start` launches the built app. Create the Windows installer with:

```powershell
npm run dist
```

This runs the build and electron-builder's NSIS target. Installer output is in `release/`; configuration is in the `build` field of `package.json`.

Other project checks: `npm run lint` runs ESLint; `npm test` runs Vitest.

## Code map

- `electron/main.ts`: window lifecycle, IPC handlers, app version, PDF opening, and close-save flow.
- `electron/preload.ts`: the renderer's context-isolated bridge.
- `electron/database.ts`: sql.js persistence, schema migrations, and built-in component seeds.
- `src/app/`: generic asset/component storage and shared registries for plugins, routes, navigation, search, settings, themes, and shortcuts.
- `src/ui/`: generic shell and components.
- `src/plugins/`: creature, spell, magic-item, trait, and print-studio features. Shared editor controls and presets live under `src/plugins/shared/`.
- `src/test/`: Vitest tests.

## Persistence and security boundary

The Electron main process owns the SQLite database at `app.getPath("userData")/atlas.db`. `sql.js` loads the database and writes the serialized database to disk when changes are made. Migrations are recorded in `_migrations`. The generic `assets` table stores an asset type, name, and plugin-owned JSON data; the `components` table stores reusable entries; `settings` stores app preferences.

The renderer uses `contextBridge` with `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`. Its bridge exposes generic database query/run operations and narrowly scoped app functions. Keep filesystem access in the main process and expose only the specific operation needed through the preload bridge.

## Adding an asset plugin

Use an existing plugin as a working example. A plugin typically defines a data schema and default value, normalization for older records, validation, exporters, editor/preview components, and optional card rendering. Its `index.tsx` registers the asset type, navigation item, and routes. Add its registration call to `src/app/registry/loadPlugins.ts` so registration runs before the route and navigation registries are read.

Plugins should use the shared asset store and registry contracts rather than adding asset-specific database tables or IPC methods. For Print Studio support, provide card rendering and card dimensions through the asset type definition.

## Adding a reusable component type

Reusable entries are persisted separately from assets. The component type registry defines available slots; the Trait feature currently provides reusable traits used by creature editing and the Print Studio library. Built-in examples are inserted by database migrations. Add new seed content in a new migration rather than changing an already shipped migration, so existing user databases receive the new entries.
