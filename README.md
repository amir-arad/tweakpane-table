# tweakpane-table

![tweakpane-table-demo](https://user-images.githubusercontent.com/6019373/218509852-643003ac-7092-4840-ab03-f919178588a2.png)

Table plugin for [Tweakpane](https://github.com/cocopon/tweakpane/).

**✨ Version 0.5.0 - Structural Refactor for Robust Horizontal Layouts!**

- For Tweakpane v4: Use tweakpane-table v0.5.x
- For Tweakpane v3: Use tweakpane-table v0.3.x

📖 **Documentation:**
- **Upgrading?** See the [Migration Guide](./MIGRATION.md)
  - v0.3.x → v0.4.x: [Tweakpane v3 to v4](./MIGRATION.md#migration-guide-tweakpane-table-v3-to-v4)
  - v0.4.x → v0.5.x: [API Changes](./MIGRATION.md#migration-guide-tweakpane-table-v04x-to-v05x)
- **Developing plugins?** See [Tweakpane Integration Guide](./TWEAKPANE_INTEGRATION.md)
  - CSS variables and theming
  - Creating horizontal layouts
  - Plugin architecture patterns

## Installation

### Browser

```html
<style>
    /* size manipulation according to: https://github.com/cocopon/tweakpane/issues/46#issuecomment-633388907  */
    .tableContainer {
        width: 350px; /* give enough space for all cells */
    }
    .tableContainer .tp-lblv_v {
        min-width: fit-content; /* don't cut off cells */
    }
</style>
<script src="tweakpane.min.js"></script>
<script src="tweakpane-table.min.js"></script>
<script>
    const pane = new Tweakpane.Pane();
    pane.element.parentElement.classList = 'tableContainer';
    pane.registerPlugin(TweakpaneTablePlugin.plugins);
</script>
```

### Package

```js
import { Pane } from 'tweakpane';
import { plugins as TweakpaneTablePlugin } from 'tweakpane-table';
const style = document.createElement('style');
style.innerHTML = `
    .tableContainer {
        width: 350px;
    }
    .tableContainer .tp-lblv_v {
        min-width: fit-content;
    }
`;
document.head.appendChild(style);
const pane = new Pane();
pane.element.parentElement.classList = 'tableContainer';
pane.registerPlugin(TweakpaneTablePlugin);
```

## Usage

Headers are just labels, Cells are just blades.

```js
// add header row
pane.addBlade({
    view: 'tableHead',
    label: 'Label',
    headers: [
        { label: 'Text', width: '80px' },
        { label: 'List', width: '160px' },
    ],
});

// add cells row
pane.addBlade({
    view: 'tableRow',
    label: 'row 1',
    cells: [
        {
            view: 'text',
            width: '80px',
            parse: (v) => String(v),
            value: 'sketch-01',
        },
        {
            view: 'list',
            width: '160px',
            options: [
                { text: 'loading', value: 'LDG' },
                { text: 'menu', value: 'MNU' },
                { text: 'field', value: 'FLD' },
            ],
            value: 'LDG',
        },
    ],
});
```

## Advanced Usage

You can dynamically add cells to a row using the `.addCell()` method. All blade types support the optional `width` property.

```js
const row = pane.addBlade({
    view: 'tableRow',
    label: `#1`,
    cells: [], // Start with empty row
});

const PARAMS = {
    speed: 0.5,
};

// Add cells dynamically
row.addCell({
    view: 'text',
    width: '100px',
    parse: (v) => String(v),
    value: `effect-01`,
});

row.addCell({
    view: 'binding',
    width: '100px',
    .../* binding params */,
});

row.addCell({
    view: 'button',
    title: 'del',
    width: '50px',
});

// Access individual cells
const firstCell = row.getCell(0); // Returns BladeApi for the first cell
const allCells = row.cells;      // Returns array of all BladeApi instances

// Listen to cell changes
firstCell.on('change', (event) => {
    console.log('Cell value changed:', event.value);
});

// Remove a cell by index
row.removeCell(0); // Removes the first cell
```

**Note:** The `width` parameter sets the flex-basis for each cell, allowing you to control column widths.

## API Reference

### TableRow API

**Methods:**
- `addCell(params)` - Add a new cell to the row
  - `params`: Blade parameters with optional `width` property
  - Returns: `BladeApi` for the created cell
- `removeCell(index)` - Remove a cell at the specified index
  - `index`: Zero-based index of the cell to remove
  - Throws error if index is out of bounds
- `getCell(index)` - Get the API for a specific cell
  - `index`: Zero-based index of the cell
  - Returns: `BladeApi` or `undefined` if not found

**Properties:**
- `cells` - Array of all cell `BladeApi` instances (read-only)

### Cell Lifecycle

When you remove a cell using `removeCell()`, it is automatically cleaned up from the DOM and internal arrays. Cell indices are updated after removal.

```js
const row = pane.addBlade({
    view: 'tableRow',
    label: 'Example',
    cells: [],
});

row.addCell({ view: 'text', value: 'Cell 0' });
row.addCell({ view: 'text', value: 'Cell 1' });
row.addCell({ view: 'text', value: 'Cell 2' });

console.log(row.cells.length); // 3

row.removeCell(1); // Remove 'Cell 1'

console.log(row.cells.length); // 2
console.log(row.getCell(1).value); // Now returns 'Cell 2' (indices shifted)
```
