# Migration Guides

## Migration Guide: tweakpane-table v0.3.x to v0.4.x

Version 0.4.0 includes a **structural refactor** that removes the internal `Pane` dependency and implements proper horizontal layout containers. This fixes the vertical cell stacking issues and provides a more robust architecture.

### Overview

- **Breaking Changes:** API changes to `getPane()` (removed) and `getCell()` (TableHead only)
- **Benefits:** No more CSS hacks, proper horizontal layout, better performance, cleaner code
- **Migration Effort:** Low - only affects advanced usage with dynamic cell addition

### Requirements

- **Tweakpane v4.0.5 or higher** (no change from v0.4.x)
- **tweakpane-table v0.4.0 or higher**

### Breaking Changes

#### 1. Removed: `.getPane()` Method

The `.getPane()` method has been removed from the `RowApi`. Previously, rows used an internal `Pane` to manage cells, but this has been replaced with a custom horizontal blade container.

**Before (v0.4.x):**
```javascript
const row = pane.addBlade({
  view: 'tableRow',
  label: 'Row 1',
  cells: [],
});

const rowPane = row.getPane(); // ❌ No longer available
rowPane.addBlade({ view: 'text', value: 'hello', width: '100px' });
rowPane.addBinding(PARAMS, 'speed', { width: '100px' });
rowPane.addButton({ title: 'Delete', width: '80px' });
```

**After (v0.4.x):**
```javascript
const row = pane.addBlade({
  view: 'tableRow',
  label: 'Row 1',
  cells: [],
});

// Use addCell() instead
row.addCell({ view: 'text', value: 'hello', width: '100px' });
row.addCell({ view: 'binding', /* ... */, width: '100px' });
row.addCell({ view: 'button', title: 'Delete', width: '80px' });
```

**Key differences:**
- Replace `row.getPane().addBlade(params)` with `row.addCell(params)`
- Replace `row.getPane().addBinding(...)` with `row.addCell({ view: 'binding', ... })`
- Replace `row.getPane().addButton(...)` with `row.addCell({ view: 'button', ... })`
- Cannot register plugins on rows anymore (rarely used)

#### 2. Changed: `.getCell()` Return Type for TableHead

For `tableHead` blades, the `getCell()` method now returns an `HTMLElement` instead of a `BindingApi`.

**Before (v0.4.x):**
```javascript
const head = pane.addBlade({
  view: 'tableHead',
  label: 'Header',
  headers: [{ label: 'Name' }, { label: 'Status' }],
});

const cell = head.getCell(0); // Returns BindingApi
cell.on('change', ...); // Could listen to events
```

**After (v0.4.x):**
```javascript
const head = pane.addBlade({
  view: 'tableHead',
  label: 'Header',
  headers: [{ label: 'Name' }, { label: 'Status' }],
});

const cell = head.getCell(0); // Returns HTMLElement
// Headers are now simple text elements, not bindings
cell.textContent; // Access the text directly
cell.style.color = 'red'; // Style the element if needed
```

**Note:** For `tableRow` blades, `getCell()` still returns `BladeApi` instances - this has not changed.

### What Stays the Same

#### ✅ Basic Usage

The basic table creation API is **100% backward compatible**:

```javascript
import { Pane } from 'tweakpane';
import { plugins as TweakpaneTablePlugin } from 'tweakpane-table';

const pane = new Pane();
pane.registerPlugin(TweakpaneTablePlugin);

// Table headers - works exactly the same
pane.addBlade({
  view: 'tableHead',
  label: 'Label',
  headers: [
    { label: 'Name', width: '100px' },
    { label: 'Status', width: '150px' },
  ],
});

// Table rows - works exactly the same
pane.addBlade({
  view: 'tableRow',
  label: 'Row 1',
  cells: [
    {
      view: 'text',
      width: '100px',
      parse: (v) => String(v),
      value: 'item-01',
    },
    {
      view: 'list',
      width: '150px',
      options: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      value: 'active',
    },
  ],
});
```

#### ✅ Width Support

The `width` parameter continues to work exactly the same way:

```javascript
row.addCell({
  view: 'text',
  width: '100px', // Still works!
  value: 'hello',
});
```

#### ✅ All Blade Types

All Tweakpane blade types continue to work in cells:

```javascript
// Text inputs
row.addCell({ view: 'text', value: 'hello', width: '100px' });

// Lists/dropdowns
row.addCell({
  view: 'list',
  options: [{ text: 'A', value: 'a' }, { text: 'B', value: 'b' }],
  value: 'a',
  width: '100px',
});

// Buttons
row.addCell({ view: 'button', title: 'Click', width: '80px' });

// Separators
row.addCell({ view: 'separator' });

// And any other blade type!
```

### Migration Checklist

- [ ] Update `tweakpane-table` to v0.4.0 or higher
- [ ] Find all uses of `.getPane()`:
  ```bash
  grep -r "\.getPane()" src/
  ```
- [ ] Replace `.getPane().addBlade(...)` with `.addCell(...)`
- [ ] Replace `.getPane().addBinding(...)` with `.addCell({ view: 'binding', ... })`
- [ ] Replace `.getPane().addButton(...)` with `.addCell({ view: 'button', ... })`
- [ ] If using `tableHead.getCell()` for more than just display:
  - [ ] Update code to work with `HTMLElement` instead of `BindingApi`
  - [ ] Remove any event listeners (headers are now static)
- [ ] Test your application thoroughly
- [ ] Verify cells display horizontally (not vertically stacked)

### Quick Reference: API Mapping

| v0.3.x (Old) | v0.4.x (New) |
|-------------|-------------|
| `row.getPane().addBlade({view: 'text', ...})` | `row.addCell({view: 'text', ...})` |
| `row.getPane().addBinding(obj, key, {...})` | `row.addCell({view: 'binding', ...})` (requires params adaptation) |
| `row.getPane().addButton({title: '...'})` | `row.addCell({view: 'button', title: '...'})` |
| `head.getCell(0)` → `BindingApi` | `head.getCell(0)` → `HTMLElement` |
| `row.getCell(0)` → `BladeApi` | `row.getCell(0)` → `BladeApi` (unchanged) |

### Benefits of Upgrading

- **Fixed Horizontal Layout:** Cells now properly display horizontally without CSS hacks
- **No More `!important`:** Clean CSS using proper flex containers
- **Better Performance:** No unnecessary Pane overhead for each row
- **Cleaner Architecture:** Custom horizontal blade containers instead of fighting the framework
- **More Maintainable:** Follows Tweakpane's recommended patterns (similar to PointNdTextView)
- **Future-Proof:** Robust against Tweakpane internal changes

### Troubleshooting

#### Cells Still Stacking Vertically

**Cause:** Cached build artifacts

**Solution:** Clear your build cache and rebuild:
```bash
npm run clean
npm run build
```

#### `.getPane()` Not Found Error

**Error:** `TypeError: row.getPane is not a function`

**Solution:** This is expected in v0.4.x. Replace with `.addCell()`:

```javascript
// ❌ Old
const rowPane = row.getPane();
rowPane.addBlade({ view: 'text', value: 'hello' });

// ✅ New
row.addCell({ view: 'text', value: 'hello' });
```

#### Header Cell Events Not Working

**Error:** `TypeError: cell.on is not a function`

**Solution:** In v0.4.x, header cells are simple HTMLElements, not BindingApi instances. Headers are meant to be static labels. If you need interactive headers, consider using a table row instead.

#### Width Not Applied

**Cause:** Missing `width` parameter

**Solution:** Ensure you're passing the `width` property:

```javascript
row.addCell({
  view: 'text',
  value: 'hello',
  width: '100px', // Don't forget this!
});
```

### Example: Complete Migration

**Before (v0.4.x):**
```javascript
for (let i = 0; i < 3; i++) {
  const row = pane.addBlade({
    view: 'tableRow',
    label: `#${i}`,
    cells: [],
  });

  const rowPane = row.getPane();

  rowPane.addBlade({
    view: 'text',
    width: '100px',
    parse: (v) => String(v),
    value: `effect-0${i}`,
  });

  rowPane.addButton({
    title: 'trigger',
    width: '50px',
  });

  rowPane.addButton({
    title: 'delete',
    width: '50px',
  });
}
```

**After (v0.4.x):**
```javascript
for (let i = 0; i < 3; i++) {
  const row = pane.addBlade({
    view: 'tableRow',
    label: `#${i}`,
    cells: [],
  });

  row.addCell({
    view: 'text',
    width: '100px',
    parse: (v) => String(v),
    value: `effect-0${i}`,
  });

  row.addCell({
    view: 'button',
    title: 'trigger',
    width: '50px',
  });

  row.addCell({
    view: 'button',
    title: 'delete',
    width: '50px',
  });
}
```

---

## Migration Guide: tweakpane-table v3 to v4

This guide will help you migrate from tweakpane-table v0.3.x (Tweakpane v3) to v0.4.x (Tweakpane v4).

## Overview

Version 0.4.0 of tweakpane-table has been updated to work with Tweakpane v4, which includes significant internal improvements and a modernized plugin system. The public API remains largely unchanged, making the migration straightforward for most users.

## Requirements

- **Tweakpane v4.0.5 or higher** (previously v3.1.4)
- Modern browser with ES2015 support (no change)

## Installation

### npm/yarn

Update your dependencies:

```bash
npm install tweakpane@^4.0.5 tweakpane-table@^0.4.0
```

or

```bash
yarn add tweakpane@^4.0.5 tweakpane-table@^0.4.0
```

### CDN / Browser

**Important:** Tweakpane v4 uses ES modules only. You have two options:

#### Option 1: ES Modules (Recommended)

Use native browser ES modules with import maps:

```html
<script type="importmap">
{
  "imports": {
    "tweakpane": "https://cdn.jsdelivr.net/npm/tweakpane@4/dist/tweakpane.min.js",
    "@tweakpane/core": "https://cdn.jsdelivr.net/npm/@tweakpane/core@2/dist/index.js"
  }
}
</script>
<script type="module">
  import { Pane } from 'tweakpane';
  import { plugins as TweakpaneTablePlugin } from 'https://cdn.jsdelivr.net/npm/tweakpane-table@0.4/dist/tweakpane-table.min.mjs';

  const pane = new Pane();
  pane.registerPlugin(TweakpaneTablePlugin);
</script>
```

**Note:** Import maps are supported in modern browsers (Chrome 89+, Firefox 108+, Safari 16.4+).

#### Option 2: UMD Build (Legacy Browsers)

For browsers that don't support ES modules or import maps, you can still use the UMD build, but you'll need to load Tweakpane via a bundler or use a polyfill. The UMD build expects `Tweakpane` to be available globally, which Tweakpane v4 doesn't provide natively.

## Breaking Changes

### 1. Tweakpane v4 Requirement

The most significant change is that **tweakpane-table v0.4.x requires Tweakpane v4**. You cannot use tweakpane-table v0.4.x with Tweakpane v3.

If you need to continue using Tweakpane v3, stay on tweakpane-table v0.3.x.

### 2. Changed: Plugin Registration

The plugin registration has changed to use the v4 bundle format.

**Before (v0.3.x with Tweakpane v3):**
```javascript
// Browser
pane.registerPlugin(TweakpaneTablePlugin);

// Package
import * as TweakpaneTablePlugin from 'tweakpane-table';
pane.registerPlugin(TweakpaneTablePlugin);
```

**After (v0.4.x with Tweakpane v4):**

**Browser with ES Modules:**
```javascript
import { Pane } from 'tweakpane';
import { plugins as TweakpaneTablePlugin } from './tweakpane-table.mjs';

const pane = new Pane();
pane.registerPlugin(TweakpaneTablePlugin);
```

**Browser with UMD (legacy):**
```javascript
// Only works if Tweakpane global is available
pane.registerPlugin(TweakpaneTablePlugin.plugins);
```

**Package (npm/yarn):**
```javascript
import { Pane } from 'tweakpane';
import { plugins as TweakpaneTablePlugin } from 'tweakpane-table';

const pane = new Pane();
pane.registerPlugin(TweakpaneTablePlugin);
```

### 3. Changed: `addInput()` and `addMonitor()` Methods

In Tweakpane v4, the `addInput()` and `addMonitor()` methods have been unified into a single `addBinding()` method. If you're using the row pane's advanced API, update your code:

**Before (v0.3.x with Tweakpane v3):**
```javascript
const rowPane = pane.addBlade({ view: 'tableRow', label: 'Row' }).getPane();

// Adding inputs
rowPane.addInput(PARAMS, 'speed', { min: 0, max: 1 });

// Adding monitors
rowPane.addMonitor(PARAMS, 'fps', { view: 'graph' });
```

**After (v0.4.x with Tweakpane v4):**
```javascript
const rowPane = pane.addBlade({ view: 'tableRow', label: 'Row' }).getPane();

// addBinding() works for both inputs and monitors
rowPane.addBinding(PARAMS, 'speed', { min: 0, max: 1 });
rowPane.addBinding(PARAMS, 'fps', { view: 'graph', readonly: true });
```

**Key differences:**
- Use `addBinding()` for both inputs and monitors
- For read-only bindings (previously `addMonitor()`), add `readonly: true` to the options
- The `width` parameter still works the same way

## What Stays the Same

### ✅ Basic Usage

The fundamental API remains unchanged (only import syntax changes):

```javascript
import { Pane } from 'tweakpane';
import { plugins as TweakpaneTablePlugin } from 'tweakpane-table';

const pane = new Pane();
pane.registerPlugin(TweakpaneTablePlugin);

// Table headers - works exactly the same
pane.addBlade({
  view: 'tableHead',
  label: 'Label',
  headers: [
    { label: 'Name', width: '100px' },
    { label: 'Status', width: '150px' },
  ],
});

// Table rows - works exactly the same
pane.addBlade({
  view: 'tableRow',
  label: 'Row 1',
  cells: [
    {
      view: 'text',
      width: '100px',
      parse: (v) => String(v),
      value: 'item-01',
    },
    {
      view: 'list',
      width: '150px',
      options: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      value: 'active',
    },
  ],
});
```

### ✅ Advanced Usage with `.getPane()`

The row pane API continues to work (with the `addBinding()` update mentioned above):

```javascript
const rowPane = pane.addBlade({
  view: 'tableRow',
  label: 'Row 1',
}).getPane();

const PARAMS = { speed: 0.5, name: 'test' };

// Add bindings with width support
rowPane.addBinding(PARAMS, 'speed', { width: '100px', min: 0, max: 1 });
rowPane.addBinding(PARAMS, 'name', { width: '150px' });

// Add buttons
rowPane.addButton({ title: 'Delete', width: '80px' });

// Add blades
rowPane.addBlade({ view: 'separator' });
```

### ✅ `.getCell()` API

The cell accessor API remains unchanged:

```javascript
const headBlade = pane.addBlade({
  view: 'tableHead',
  label: 'Header',
  headers: [{ label: 'Col1' }, { label: 'Col2' }],
});

const cell = headBlade.getCell(0); // Get first header cell
```

### ✅ Styling

Your existing CSS customizations continue to work:

```css
.tableContainer {
  width: 350px;
}
.tableContainer .tp-lblv_v {
  min-width: fit-content;
}
```

## Migration Checklist

- [ ] Update `tweakpane` to v4.0.5 or higher
- [ ] Update `tweakpane-table` to v0.4.0 or higher
- [ ] Update imports:
  - [ ] Browser ES modules: Use `import { plugins }` from `.mjs` file with import maps
  - [ ] Browser UMD (legacy): Use `TweakpaneTablePlugin.plugins`
  - [ ] Package: Change `import * as TweakpaneTablePlugin` to `import { plugins as TweakpaneTablePlugin }`
- [ ] If using `.getPane()` with `addInput()` or `addMonitor()`:
  - [ ] Replace `addInput()` calls with `addBinding()`
  - [ ] Replace `addMonitor()` calls with `addBinding(..., { readonly: true })`
- [ ] Test your application thoroughly
- [ ] Check browser console for deprecation warnings

## Troubleshooting

### Module Resolution Errors in Browser

**Error:** `Failed to resolve module specifier "@tweakpane/core"` or `Uncaught SyntaxError: Unexpected token 'export'`

**Solution:** You're trying to use ES modules without import maps. Add an import map to your HTML:

```html
<script type="importmap">
{
  "imports": {
    "tweakpane": "./node_modules/tweakpane/dist/tweakpane.js",
    "@tweakpane/core": "./node_modules/@tweakpane/core/dist/index.js"
  }
}
</script>
```

Or use the `.mjs` files instead of `.js`:
```javascript
import { plugins } from './tweakpane-table.mjs'; // Use .mjs for ESM
```

### Plugin Not Registering

**Error:** Plugin registration fails or table blades don't appear

**Solution:** Ensure you're using Tweakpane v4.0.5 or higher:

```bash
npm list tweakpane
```

If you see v3.x, upgrade:

```bash
npm install tweakpane@^4.0.5
```

Also verify you're using the correct import syntax:
```javascript
// ✅ Correct
import { plugins as TweakpaneTablePlugin } from 'tweakpane-table';

// ❌ Wrong
import * as TweakpaneTablePlugin from 'tweakpane-table';
```

### TypeScript Errors

**Error:** Type errors related to `addInput` or `addMonitor`

**Solution:** Update to `addBinding()` as shown above. If you're still seeing errors, ensure your `@types/tweakpane` is up to date (or removed, as Tweakpane v4 includes built-in types).

### Bindings Not Working

**Error:** Values don't update or controls don't respond

**Solution:** Check that you're passing the object and key correctly to `addBinding()`:

```javascript
// ✅ Correct
const PARAMS = { speed: 0.5 };
rowPane.addBinding(PARAMS, 'speed');

// ❌ Wrong
rowPane.addBinding({ speed: 0.5 }, 'speed'); // Creates new object, won't bind
```

### Width Not Applied

**Error:** The `width` parameter doesn't work

**Solution:** The `width` parameter is a custom extension that works with `addBinding()`, `addButton()`, and `addBlade()` when used on a row pane. Ensure you're calling these methods on the pane returned by `.getPane()`:

```javascript
const rowPane = blade.getPane(); // Get the row pane
rowPane.addBinding(PARAMS, 'value', { width: '100px' }); // ✅ Works
```

## Benefits of Upgrading

- **Better Performance:** Tweakpane v4 includes performance optimizations
- **Improved Type Safety:** Better TypeScript definitions
- **Future-Proof:** Access to new Tweakpane v4 features and ongoing support
- **Unified API:** Simpler binding API with `addBinding()`
- **Better Tree-Shaking:** ES modules enable better dead code elimination
- **Smaller Bundle Sizes:** Shared `@tweakpane/core` dependency reduces duplication
- **Bug Fixes:** Latest bug fixes from both Tweakpane and tweakpane-table

## Need Help?

If you encounter issues during migration:

1. Check the [Tweakpane v4 migration guide](https://github.com/cocopon/tweakpane/blob/main/MIGRATION.md)
2. Review the [tweakpane-table examples](https://github.com/amir-arad/tweakpane-table#usage)
3. Open an issue on [GitHub](https://github.com/amir-arad/tweakpane-table/issues)

## Staying on v3

If you're not ready to migrate to Tweakpane v4, you can continue using:

```json
{
  "dependencies": {
    "tweakpane": "^3.1.4",
    "tweakpane-table": "^0.3.1"
  }
}
```

However, we recommend upgrading when possible to benefit from the latest improvements and support.
