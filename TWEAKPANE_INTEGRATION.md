# Tweakpane v4 Integration Guide

This document captures deep knowledge about Tweakpane v4's architecture, CSS system, and integration patterns learned during the development of tweakpane-table v0.4.0.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [CSS Variable System](#css-variable-system)
- [Creating Custom Layouts](#creating-custom-layouts)
- [Plugin Integration Patterns](#plugin-integration-patterns)
- [Common Pitfalls & Solutions](#common-pitfalls--solutions)
- [Browser Caching Issues](#browser-caching-issues)

---

## Architecture Overview

### Tweakpane v4 Plugin Structure

Tweakpane v4 uses a plugin-based architecture with ES modules:

```typescript
import { createPlugin, BladePlugin } from '@tweakpane/core';

const myPlugin: BladePlugin<MyParams> = createPlugin({
    id: 'my-plugin',
    type: 'blade',
    accept(params) {
        // Validate and parse parameters
        return parseRecord<MyParams>(params, (p) => ({
            view: p.required.constant('my-view'),
            // ... other params
        }));
    },
    controller(args) {
        // Create and return a BladeController instance
        return new MyController(args.document, {
            blade: args.blade,
            viewProps: args.viewProps,
            // ... custom config
        });
    },
    api({ controller, pool }) {
        // pool is the PluginPool for creating child blades
        // Create and return a BladeApi instance
        return new MyApi(controller, pool);
    }
});
```

### Key Components

#### BladeController
- **v3**: Used `LabelController` wrapper
- **v4**: Extend `BladeController` directly for cleaner architecture

```typescript
export class MyController extends BladeController<MyView> {
    constructor(doc: Document, config: MyConfig) {
        const view = new MyView(doc, { viewProps: config.viewProps });
        super({ blade: config.blade, view, viewProps: config.viewProps });
    }
}
```

#### PluginPool
The `PluginPool` (passed to the `api()` function) is used to create child blades dynamically:

```typescript
api({ controller, pool }) {
    // Store pool reference to create blades later
    controller.setPool(pool);
    return new MyApi(controller, pool);
}

// Later, in the controller:
const bladeController = this.pool_.createBlade(this.doc_, params);
const bladeApi = this.pool_.createApi(bladeController);
```

**Important**: The pool is only available in the `api()` function, not in the `controller()` function.

---

## CSS Variable System

### Tweakpane's CSS Variable Architecture

Tweakpane v4 uses **short CSS variable names** to reduce file size. The mapping is defined in `@tweakpane/core/lib/sass/common/_defs.scss`:

```scss
$css-vars: (
    'base-bg': 'bs-bg',
    'base-border-radius': 'bs-br',
    'label-fg': 'lbl-fg',
    'input-bg': 'in-bg',
    'button-bg': 'btn-bg',
    // ... etc
);
```

### Using CSS Variables in Plugin SCSS

**✅ Correct way:**

```scss
@use '../../node_modules/@tweakpane/core/lib/sass/tp';

.my-element {
    color: tp.cssVar('label-fg');        // Compiles to: var(--lbl-fg)
    background: tp.cssVar('input-bg');   // Compiles to: var(--in-bg)
}
```

**❌ Wrong ways:**

```scss
// Don't use CSS variables directly (wrong name):
.my-element {
    color: var(--tp-label-fg);  // ❌ Variable doesn't exist
    color: var(--label-fg);     // ❌ Wrong, it's --lbl-fg
}

// Don't try to use SCSS placeholders (they don't exist):
.my-element {
    @extend %tp-label;  // ❌ Error: placeholder not found
}
```

### Available CSS Variables

Common variables you'll use in plugins:

| Long Name | Short Name | Purpose | Example Value |
|-----------|------------|---------|---------------|
| `label-fg` | `lbl-fg` | Label text color | `rgba(187, 188, 196, 0.7)` |
| `input-fg` | `in-fg` | Input text color | `hsl(230, 7%, 75%)` |
| `input-bg` | `in-bg` | Input background | `rgba(187, 188, 196, 0.1)` |
| `button-bg` | `btn-bg` | Button background | `hsl(230, 7%, 70%)` |
| `button-fg` | `btn-fg` | Button text color | `hsl(230, 7%, 17%)` |
| `container-bg` | `cnt-bg` | Container background | `rgba(187, 188, 196, 0.1)` |
| `blade-value-width` | `bld-vw` | Standard value width | `160px` |
| `base-bg` | `bs-bg` | Base background | `hsl(230, 7%, 17%)` |

**Complete list**: See `node_modules/@tweakpane/core/lib/sass/common/_defs.scss`

### CSS Variables are Scoped

CSS variables are defined at the Pane root level (`.tp-rotv`) and cascade down. They're **not global**.

```javascript
// CSS vars are available on elements inside the Pane:
const styles = window.getComputedStyle(element);
const labelColor = styles.getPropertyValue('--lbl-fg');
// Returns: "rgba(187, 188, 196, 0.7)"
```

---

## Creating Custom Layouts

### The Pane Problem

**Tweakpane's `Pane` class creates vertical layouts by default.** Using Pane for horizontal layouts requires fighting the framework with CSS hacks.

#### Default Pane Structure

```html
<div class="tp-rotv">         <!-- Root container -->
    <div class="tp-brkv">     <!-- Blade rack -->
        <div class="tp-rotv_c"> <!-- Children container (VERTICAL by default) -->
            <div class="tp-lblv">...</div>  <!-- Blade 1 -->
            <div class="tp-lblv">...</div>  <!-- Blade 2 -->
            <div class="tp-lblv">...</div>  <!-- Blade 3 -->
        </div>
    </div>
</div>
```

The `.tp-rotv_c` container is styled for vertical stacking. Overriding this with CSS is fragile.

### The PointNdTextView Pattern (Recommended)

**Tweakpane's internal horizontal layouts** (like Point2d, Point3d inputs) use a pattern called **PointNdTextView**. This is the canonical way to create horizontal layouts in Tweakpane:

#### Pattern Overview

1. **Create a custom View** that builds a horizontal flex container
2. **Create wrapper divs** for each child element
3. **Append child views** (not full blades) directly to wrappers
4. **Use CSS flexbox** on your own classes

#### Example Implementation

```typescript
// View creates the structure
export class HorizontalView implements View {
    public readonly element: HTMLElement;
    public readonly containerElement: HTMLElement;

    constructor(doc: Document, config: ViewConfig) {
        // Create root
        this.element = doc.createElement('div');
        this.element.classList.add(className('horizontal'));

        // Create flex container
        this.containerElement = doc.createElement('div');
        this.containerElement.classList.add(className('horizontal-container'));
        this.element.appendChild(this.containerElement);

        config.viewProps.bindClassModifiers(this.element);
    }
}

// Controller manages the content
export class HorizontalController extends BladeController<HorizontalView> {
    private pool_: PluginPool;

    addChild(params: BladeParams) {
        // Create wrapper for this child
        const wrapper = this.doc_.createElement('div');
        wrapper.classList.add(className('cell'));

        // Create child blade using PluginPool
        const childController = this.pool_.createBlade(this.doc_, params);
        const childApi = this.pool_.createApi(childController);

        // Add child's view to wrapper
        wrapper.appendChild(childController.view.element);

        // Add wrapper to container
        this.view.containerElement.appendChild(wrapper);

        return childApi;
    }
}
```

#### SCSS for Horizontal Layout

```scss
@use '../../node_modules/@tweakpane/core/lib/sass/tp';

.#{tp.$prefix}-horizontal-container {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: stretch;
    width: 100%;
}

.#{tp.$prefix}-cell {
    flex: 1;  // Equal width by default

    // Spacing between cells
    & + & {
        margin-left: 2px;
    }

    // Children should fill the cell
    > * {
        flex: 1;
        min-width: 0;  // Allow flex shrinking
    }
}
```

### Width Control

To allow custom widths on cells:

```typescript
interface CellParams extends BaseBladeParams {
    width?: string;
}

addChild(params: CellParams) {
    const wrapper = this.doc_.createElement('div');
    wrapper.classList.add(className('cell'));

    // Apply width if specified
    if (params.width) {
        wrapper.style.flex = `0 0 ${params.width}`;
    }

    // ... rest of implementation
}
```

---

## Plugin Integration Patterns

### Plugin Bundle Structure

Tweakpane v4 expects plugins as bundles:

```typescript
// src/index.ts
export const plugins = {
    id: 'my-plugin',
    plugins: [plugin1, plugin2, ...],
    css: '__css__',  // Replaced at build time
};
```

### CSS Injection

CSS is embedded in the JavaScript bundle and injected at runtime:

#### Rollup Configuration

```javascript
// rollup.config.js
import Sass from 'sass';
import Postcss from 'postcss';
import Autoprefixer from 'autoprefixer';
import Replace from '@rollup/plugin-replace';

async function compileCss() {
    // Compile SCSS
    const css = Sass.renderSync({
        file: 'src/sass/plugin.scss',
        outputStyle: 'compressed',
    }).css.toString();

    // Post-process with autoprefixer
    const result = await Postcss([Autoprefixer]).process(css, {
        from: undefined,
    });

    // Escape single quotes for JavaScript string
    return result.css.replace(/'/g, "\\'").trim();
}

// In plugins array:
Replace({
    preventAssignment: false,
    __css__: css,  // Replace '__css__' with compiled CSS
})
```

### Import Patterns

#### For Package Users (npm)

```javascript
import { Pane } from 'tweakpane';
import { plugins as MyPlugin } from 'my-plugin';

const pane = new Pane();
pane.registerPlugin(MyPlugin);
```

#### For Browser Users (ES Modules)

```html
<script type="importmap">
{
  "imports": {
    "tweakpane": "./node_modules/tweakpane/dist/tweakpane.js",
    "@tweakpane/core": "./node_modules/@tweakpane/core/dist/index.js"
  }
}
</script>
<script type="module">
  import { Pane } from 'tweakpane';
  import { plugins as MyPlugin } from './my-plugin.mjs';

  const pane = new Pane();
  pane.registerPlugin(MyPlugin);
</script>
```

#### For Browser Users (UMD)

```html
<script src="tweakpane.min.js"></script>
<script src="my-plugin.min.js"></script>
<script>
  const pane = new Tweakpane.Pane();
  pane.registerPlugin(MyPlugin.plugins);  // Note: .plugins property
</script>
```

---

## Common Pitfalls & Solutions

### 1. Fighting the CSS Instead of Using Proper Patterns

**❌ Bad Approach:**
```scss
// Trying to force Pane's internal containers horizontal
.my-plugin .tp-rotv_c {
    display: flex !important;
    flex-direction: row !important;
}
```

**Problems:**
- Relies on Tweakpane's internal class names (`.tp-rotv_c`)
- Requires `!important` to override
- Fragile (breaks if Tweakpane changes internals)
- Still creates unnecessary DOM hierarchy

**✅ Good Approach:**
```typescript
// Create your own horizontal container
export class MyView implements View {
    public readonly element: HTMLElement;
    public readonly containerElement: HTMLElement;

    constructor(doc: Document, config: ViewConfig) {
        this.element = doc.createElement('div');
        this.element.classList.add(className('my-horizontal'));

        this.containerElement = doc.createElement('div');
        this.containerElement.classList.add(className('container'));
        this.element.appendChild(this.containerElement);
    }
}
```

```scss
.#{tp.$prefix}-my-horizontal {
    display: flex;
    flex-direction: row;
    // ... no !important needed
}
```

### 2. Trying to Use PluginPool in controller()

**❌ Wrong:**
```typescript
controller(args) {
    const ctrl = new MyController(args.document, {
        blade: args.blade,
        viewProps: args.viewProps,
        pool: ???  // ❌ Pool not available here!
    });
    return ctrl;
}
```

**✅ Correct:**
```typescript
controller(args) {
    return new MyController(args.document, {
        blade: args.blade,
        viewProps: args.viewProps,
    });
},
api({ controller, pool }) {
    // ✅ Pool is available here
    controller.setPool(pool);
    return new MyApi(controller, pool);
}
```

### 3. Incorrect CSS Variable Usage

**❌ Wrong:**
```scss
.my-element {
    color: var(--tp-label-fg);  // ❌ Wrong variable name
}
```

**✅ Correct:**
```scss
@use '../../node_modules/@tweakpane/core/lib/sass/tp';

.my-element {
    color: tp.cssVar('label-fg');  // ✅ Compiles to var(--lbl-fg)
}
```

### 4. Forgetting to Handle Disposal

**❌ Missing disposal:**
```typescript
addChild(params) {
    const childController = this.pool_.createBlade(this.doc_, params);
    const childApi = this.pool_.createApi(childController);

    this.view.containerElement.appendChild(childController.view.element);

    return childApi;  // ❌ Memory leak! No cleanup
}
```

**✅ With disposal:**
```typescript
addChild(params) {
    const childController = this.pool_.createBlade(this.doc_, params);
    const childApi = this.pool_.createApi(childController);

    const wrapper = this.doc_.createElement('div');
    wrapper.appendChild(childController.view.element);
    this.view.containerElement.appendChild(wrapper);

    // ✅ Handle disposal
    childController.viewProps.handleDispose(() => {
        const index = this.childControllers.indexOf(childController);
        if (index !== -1) {
            this.childControllers.splice(index, 1);
            this.childApis.splice(index, 1);
        }
        wrapper.remove();
    });

    return childApi;
}
```

### 5. Creating Views Without viewProps Binding

**❌ Missing binding:**
```typescript
export class MyView implements View {
    public readonly element: HTMLElement;

    constructor(doc: Document, config: ViewConfig) {
        this.element = doc.createElement('div');
        this.element.classList.add(className('my-view'));
        // ❌ Forgot to bind viewProps!
    }
}
```

**✅ With binding:**
```typescript
export class MyView implements View {
    public readonly element: HTMLElement;

    constructor(doc: Document, config: ViewConfig) {
        this.element = doc.createElement('div');
        this.element.classList.add(className('my-view'));

        // ✅ Bind viewProps for disabled/hidden states
        config.viewProps.bindClassModifiers(this.element);
    }
}
```

---

## Browser Caching Issues

### The Problem

Modern browsers aggressively cache ES modules. When you rebuild your plugin, the browser may serve the **cached old version** instead of your new code, even with a hard refresh (Ctrl+F5).

### Symptoms

- CSS changes don't appear in the browser
- `console.log` the CSS string shows the new CSS, but the browser shows old CSS
- Hard refresh doesn't help
- DevTools shows old CSS rules

### Solutions

#### Solution 1: Cache Busting Query Parameter

```html
<!-- test/simple.html -->
<script type="module">
    import { Pane } from '../node_modules/tweakpane/dist/tweakpane.js';
    import { plugins as MyPlugin } from '../dist/my-plugin.mjs?v=2';  // ✅ Add ?v=X
</script>
```

Increment the version number (`?v=2` → `?v=3`) after each build to force reload.

#### Solution 2: Disable Cache in DevTools

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Keep DevTools open while testing

#### Solution 3: HTTP Server with No-Cache Headers

```bash
# For development, use a server that sends no-cache headers
npx http-server -p 8080 -c-1  # -c-1 disables caching
```

#### Solution 4: Clear Browser Cache

**Chrome:**
- Press `Ctrl+Shift+Delete`
- Select "Cached images and files"
- Click "Clear data"

**Or use Incognito mode** for testing (Ctrl+Shift+N)

### Best Practice for Development

Create a development HTML file with cache busting:

```html
<!-- test/simple-dev.html -->
<script type="module">
    const timestamp = Date.now();
    const { Pane } = await import('../node_modules/tweakpane/dist/tweakpane.js');
    const { plugins } = await import(`../dist/my-plugin.mjs?t=${timestamp}`);

    const pane = new Pane();
    pane.registerPlugin(plugins);
</script>
```

---

## Additional Resources

### Official Documentation
- **Tweakpane v4 Docs**: https://tweakpane.github.io/docs/
- **Plugin Development**: https://tweakpane.github.io/docs/plugins/
- **Migration Guide**: https://github.com/cocopon/tweakpane/blob/main/MIGRATION.md

### Internal Tweakpane Patterns to Study

If you need to understand how Tweakpane implements certain features:

- **PointNdTextView**: `node_modules/@tweakpane/core/lib/sass/view/_point-nd-text.scss`
  - The canonical horizontal layout pattern
- **Label styles**: `node_modules/@tweakpane/core/lib/sass/view/_label.scss`
  - How labels are styled and positioned
- **CSS Variables**: `node_modules/@tweakpane/core/lib/sass/common/_defs.scss`
  - Complete list of CSS variables and the `cssVar()` function

### Key Takeaways

1. **Don't use Pane for horizontal layouts** - create custom views instead
2. **Follow the PointNdTextView pattern** for horizontal blade arrangements
3. **Use `tp.cssVar('name')` for colors** - never hardcode colors
4. **PluginPool is only available in `api()`** - not in `controller()`
5. **Always bind viewProps** - enables disabled/hidden states
6. **Handle disposal properly** - prevents memory leaks
7. **Use cache busting during development** - browser caching is aggressive

---

**Document Version**: 1.0
**Last Updated**: 2025-11-16
**Tweakpane Version**: 4.0.5+
**Author**: Generated during tweakpane-table v0.4.0 development
