# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Tweakpane v4 plugin that adds table functionality to Tweakpane UI controls. The plugin provides two custom blades: `tableHead` for header rows and `tableRow` for data rows.

**Current Version:** 0.4.0 (Tweakpane v4 compatible)
- Requires: Tweakpane v4.0.5+, @tweakpane/core v2.0.5+

## Development Commands

### Build
```bash
npm run build          # Build both dev and prod versions + type definitions
npm run build:dev      # Build development version only
npm run build:prod     # Build production (minified) version only
npm run build:dts      # Build TypeScript type definitions only
```

### Watch Mode
```bash
npm start              # Alias for watch mode
npm run watch          # Watch TypeScript and SASS files for changes
npm run watch:ts       # Watch TypeScript files only
npm run watch:sass     # Watch SASS files only
```

### Testing & Linting
```bash
npm test               # Run ESLint on all TypeScript files
npm run format         # Format SASS and TypeScript files
npm run format:ts      # Format TypeScript files with ESLint --fix
npm run format:scss    # Format SASS files with Prettier
```

### Packaging
```bash
npm run assets         # Clean, build, version, and create zip archive
npm run clean          # Remove dist/ and package artifacts
```

## Architecture

### Plugin Structure (Tweakpane v4)

The plugin exports a **plugin bundle** containing two blade plugins:
- `tableHeadPlugin` - Header row with labels (src/head.ts)
- `tableRowPlugin` - Data row with cells (src/row.ts)

Both are exported from src/index.ts as a plugin bundle object:
```typescript
export const plugins = {
  id: 'table',
  plugins: [tableHeadPlugin, tableRowPlugin],
  css: '__css__', // Compiled SASS injected at build time
};
```

### Key Components

**TableHead (src/head.ts)**
- `TableHeadController` extends `BladeController<HeadView>` (v4 pattern)
- Creates a label row for table headers
- Each header is rendered as a binding (using `addBinding()` in v4)
- Headers support optional `width` property for sizing
- API: `HeadApi extends BladeApi<TableHeadController>`
  - `getCell(i)` method to access individual header cells

**TableRow (src/row.ts)**
- `TableRowController` extends `BladeController<RowView>` (v4 pattern)
- Creates a data row using a custom horizontal flex container
- Cells can be any Tweakpane blade (bindings, buttons, etc.)
- Cells are optional - rows can be empty and populated programmatically
- Cells support optional `width` property for sizing (applied via flex-basis)
- API: `RowApi extends BladeApi<TableRowController>`
  - `getCell(i)` returns BladeApi for cell at index
  - `addCell(params)` dynamically adds a cell with optional width
  - `removeCell(index)` removes a cell at the specified index
  - `cells` property returns array of all cell BladeApi instances

**Important v4 Changes:**
- Controllers now extend `BladeController` instead of using `LabelController` wrapper
- Use `addBinding()` instead of `addInput()`/`addMonitor()`
- `BindingApi` replaces `InputBindingApi` and `MonitorBindingApi`

### Build System

**Rollup Configuration (rollup.config.js)**
- Builds UMD bundles for browser and package use
- Compiles SASS to CSS and injects it inline via `__css__` placeholder
- Creates both development and minified production builds
- Aliases `@tweakpane/core` to `dist/index.js` (v4 is ES modules only)
- Suppresses circular dependency warnings (expected with @tweakpane/core)

**TypeScript Configuration (src/tsconfig.json)**
- `skipLibCheck: true` to avoid @types/node compatibility issues
- Targets ES6 with DOM and ES2015 libs

### Styling

SASS files in src/sass/ are compiled and injected into the JavaScript bundle. CSS is not distributed separately.

## Code Patterns

### Plugin Registration (v4)
Both plugins use the Tweakpane v4 plugin structure with `createPlugin()`:
1. Wrapped with `createPlugin({ id, type, accept, controller, api })`
2. `accept()` - Validates parameters using `parseRecord()` with callback:
   ```typescript
   parseRecord<T>(params, (p) => ({
     view: p.required.constant('tableHead'),
     label: p.required.string,
     // ... more fields
   }))
   ```
3. `controller()` - Creates a custom controller extending `BladeController`
4. `api()` - Returns a custom API class extending `BladeApi`

### Width Support
Both headers and row cells support an optional `width` property. Width is applied using CSS flex-basis via the shared `applyWidth()` utility function in src/util.ts. Cell wrappers are created with `flex: 0 0 ${width}` to maintain fixed widths.

### CSS Class Naming
Uses Tweakpane's `ClassName` helper:
- `ClassName('table')` generates `tp-tablev`
- `ClassName('head')` generates `tp-headv`
- `ClassName('row')` generates `tp-rowv`

## ESLint Rules

- Import sorting is enforced (`sort-imports: error`)
- Variable naming must be camelCase, PascalCase, or UPPER_CASE
- Variables prefixed with `opt_` are not allowed (use `?` optional syntax instead)
- Unused vars starting with `_` are allowed

## Migration Notes

**Version 0.4.0** - Tweakpane v3 to v4 upgrade:
1. Update dependencies: @tweakpane/core v1→v2, tweakpane v3→v4
2. SCSS: `@import` → `@use` with namespace (`tp.$prefix`)
3. Plugins: Wrap with `createPlugin()`, use `parseRecord()` with callback
4. Controllers: Extend `BladeController` instead of using `LabelController`
5. API: `parseParams` → `parseRecord`, `ParamsParsers` → `MicroParsers`
6. Bundle: Export as object with `id`, `plugins`, `css` instead of array
7. Rollup: Update alias path to `dist/index.js` (v4 is ES-only)
- Removed `RowPane` class and `getPane()` method
- Added `addCell()` and `removeCell()` methods for dynamic cell management
- Improved cell initialization (removed setTimeout hack)
- Added shared `applyWidth()` utility function
- Better type safety with extracted `Blade` type

See [MIGRATION.md](./MIGRATION.md) for user-facing migration guide.

## Tweakpane Integration Guide

For deep technical knowledge about Tweakpane v4 architecture, CSS system, and integration patterns, see [TWEAKPANE_INTEGRATION.md](./TWEAKPANE_INTEGRATION.md). This document covers:

- **CSS Variable System**: How to use `tp.cssVar()` and avoid common pitfalls
- **Horizontal Layouts**: The PointNdTextView pattern (don't use Pane for horizontal layouts!)
- **Plugin Architecture**: PluginPool usage, blade creation, and disposal handling
- **Browser Caching**: Why your CSS changes might not appear and how to fix it

**Key Takeaway for Development**: Never use `Pane` for horizontal layouts - create custom views with direct flex containers instead. This avoids CSS hacks and creates robust, maintainable code.
