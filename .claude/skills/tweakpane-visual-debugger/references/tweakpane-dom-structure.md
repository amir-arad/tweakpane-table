# Tweakpane DOM Structure Reference

This document explains the DOM structure used by Tweakpane v4 and how it applies to the tweakpane-table plugin.

## Core Tweakpane Classes

### `.tp-lblv` - Labeled View (Binding Container)

The fundamental container for any Tweakpane binding (input, monitor, etc.). Contains both label and value portions.

```html
<div class="tp-lblv">
  <div class="tp-lblv_l">Label Text</div>
  <div class="tp-lblv_v">
    <!-- Value content (input, button, etc.) -->
  </div>
</div>
```

**CSS Properties:**
- Default: `display: flex` with horizontal layout
- Label (`.tp-lblv_l`): Usually fixed width or flex-grow: 0
- Value (`.tp-lblv_v`): Usually `flex: 1` to fill remaining space

### `.tp-brkv` - Break View (Pane Container)

Container for multiple blades arranged horizontally or vertically. Used by the `Pane` class.

```html
<div class="tp-brkv">
  <div class="tp-lblv"><!-- First blade --></div>
  <div class="tp-lblv"><!-- Second blade --></div>
  <!-- More blades -->
</div>
```

**CSS Properties:**
- `display: flex`
- `flex-direction: column` (default) or `row` (for horizontal layout)
- Used by tweakpane-table for horizontal cell arrangement

### `.tp-rotv` - Root View

The root container for a Pane or blade group.

```html
<div class="tp-rotv">
  <div class="tp-rotv_c">
    <!-- Content -->
  </div>
</div>
```

## Tweakpane-Table Plugin Structure

### Table Header (`.tp-headv`)

```html
<div class="tp-lblv">
  <div class="tp-lblv_l">Label</div>  <!-- Outer label for whole header row -->
  <div class="tp-lblv_v">
    <div class="tp-tablev tp-headv">  <!-- Custom table head view -->
      <div class="tp-brkv">  <!-- Pane container -->
        <div class="tp-lblv">  <!-- Header cell 1 -->
          <div class="tp-lblv_l" style="display: none"></div>  <!-- Hidden -->
          <div class="tp-lblv_v">
            <input class="tp-txtv_i" readonly value="Text">
          </div>
        </div>
        <div class="tp-lblv">  <!-- Header cell 2 -->
          <div class="tp-lblv_l" style="display: none"></div>  <!-- Hidden -->
          <div class="tp-lblv_v">
            <input class="tp-txtv_i" readonly value="List">
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Key Points:**
- Wrapped in `LabeledBladeController` which adds outer `.tp-lblv` wrapper
- Inner `.tp-tablev.tp-headv` is the custom view
- Contains horizontal Pane (`.tp-brkv`)
- Each header cell is a binding with empty label and readonly text value
- Labels are hidden via CSS: `.tp-headv .tp-lblv_l { display: none }`

### Table Row (`.tp-rowv`)

```html
<div class="tp-lblv">
  <div class="tp-lblv_l">row 1</div>  <!-- Outer label for whole row -->
  <div class="tp-lblv_v">
    <div class="tp-tablev tp-rowv">  <!-- Custom table row view -->
      <div class="tp-brkv">  <!-- Pane container -->
        <div class="tp-lblv">  <!-- Data cell 1 -->
          <div class="tp-lblv_l" style="display: none"></div>  <!-- Hidden -->
          <div class="tp-lblv_v">
            <input class="tp-txtv_i" value="sketch-01">
          </div>
        </div>
        <div class="tp-lblv">  <!-- Data cell 2 -->
          <div class="tp-lblv_l" style="display: none"></div>  <!-- Hidden -->
          <div class="tp-lblv_v">
            <select class="tp-lstv_s">...</select>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Key Points:**
- Same structure as headers
- Wrapped in `LabeledBladeController`
- Inner `.tp-tablev.tp-rowv` is the custom view
- Contains horizontal Pane (`.tp-brkv`)
- Each cell is a binding/blade with empty label
- Labels are hidden via CSS: `.tp-rowv .tp-lblv_l { display: none }`

## Width Application

Width should be applied to the `.tp-lblv` elements (cells) inside the `.tp-brkv` container.

**Correct approach (current implementation):**
```javascript
api.element.style.flex = `0 0 ${width}`;  // Apply to .tp-lblv
```

This sets:
- `flex-grow: 0` - don't expand
- `flex-shrink: 0` - don't shrink
- `flex-basis: {width}` - use this width

**Why `flex` instead of `width`:**
- The `.tp-brkv` uses `display: flex`
- Child `.tp-lblv_v` elements have `flex: 1` which makes them expand
- Using `flex: 0 0 {width}` on the `.tp-lblv` prevents both the container and its children from expanding

## Common CSS Rules

```scss
// Table container - horizontal flex layout
.tp-tablev .tp-brkv {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  width: fit-content;
  background-color: transparent;
}

// Hide labels in both headers and rows
.tp-rowv .tp-lblv_l,
.tp-headv .tp-lblv_l {
  display: none;
}

// Cell value - flex: 1 causes expansion issues
.tp-tablev .tp-lblv_v {
  min-width: auto;
  flex: 1;
}

// Header-specific styling
.tp-headv .tp-lblv_v {
  opacity: 0.7;
  font-weight: 500;
  text-align: center;
  pointer-events: none;
}
```

## Alignment Requirements

For headers and rows to align:

1. **Same DOM depth**: Both must have same nesting level from `.tp-brkv` to cell
2. **Same flex settings**: Width/flex must be applied to same element level
3. **Same padding/margin**: All cells must have consistent spacing
4. **Same box-sizing**: Usually `border-box` for both
5. **Hidden labels**: Both must hide `.tp-lblv_l` to show only values

## Debugging Checklist

When debugging alignment:
- [ ] Verify both headers and rows have `.tp-brkv` containers
- [ ] Check that width/flex is applied to `.tp-lblv` (cell container)
- [ ] Confirm labels (`.tp-lblv_l`) are hidden in both
- [ ] Compare computed styles of header vs row cells
- [ ] Measure actual dimensions with `getBoundingClientRect()`
- [ ] Check for extra padding/margin/border differences
- [ ] Verify `flex: 1` on `.tp-lblv_v` isn't causing expansion
