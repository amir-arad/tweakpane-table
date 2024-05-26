# tweakpane-table

![tweakpane-table-demo](https://user-images.githubusercontent.com/6019373/218509852-643003ac-7092-4840-ab03-f919178588a2.png)

Table plugin for [Tweakpane](https://github.com/cocopon/tweakpane/).

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
    pane.registerPlugin(TweakpaneTablePlugin);
</script>
```

### Package

```js
import { Pane } from 'tweakpane';
import * as TweakpaneTablePlugin from 'tweakpane-table';
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

Actually, every row is managed by a horizontal `Pane`.
Access the row pane using `.getPane()` to add inputs, monitors, buttons or blades. It is possible to add `width` property to all of them.

Hint: You can register other plugins to the row Pane!

```js
const rowPane = pane
    .addBlade({
        view: 'tableRow',
        label: `#1`,
    })
    .getPane(); // notice this! accessing the row pane

// now just add stuff
rowPane.registerPlugin(SomePlugin);
const PARAMS = {
    speed: 0.5,
};
rowPane.addBlade({
    view: 'text',
    width: '100px',
    parse: (v) => String(v),
    value: `effect-0${i}`,
});
pane.addBinding(PARAMS, 'speed');
rowPane.addButton({
    title: 'del',
    width: '50px',
});
```
