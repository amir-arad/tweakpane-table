# Common Alignment Issues in Tweakpane-Table

This document catalogs known alignment issues in the tweakpane-table plugin and their solutions.

## Issue 1: Headers Wider Than Data Cells

**Symptoms:**
- Header cells appear wider than corresponding data cells
- Columns don't line up vertically
- Text in headers vs cells is offset

**Root Cause:**
Width property applied to wrong element or overridden by flex properties.

**Diagnosis:**
```javascript
// Check where width is applied
const headerCell = document.querySelector('.tp-headv .tp-lblv');
const rowCell = document.querySelector('.tp-rowv .tp-lblv');

console.log('Header inline width:', headerCell.style.width);
console.log('Header inline flex:', headerCell.style.flex);
console.log('Row inline width:', rowCell.style.width);
console.log('Row inline flex:', rowCell.style.flex);
```

**Solution:**
Apply `flex: 0 0 {width}` instead of just `width`:

```javascript
// In src/head.ts and src/row.ts
api.element.style.flex = `0 0 ${width}`;  // Not just .width
```

**Why This Works:**
- `.tp-lblv_v` child has `flex: 1` which causes expansion
- `flex: 0 0 {width}` prevents expansion by setting flex-grow and flex-shrink to 0

## Issue 2: Labels Visible in Headers But Not Rows

**Symptoms:**
- Headers show both label and value portions
- Rows show only value portions
- Header cells have extra width from label

**Root Cause:**
CSS rule to hide labels not applied to headers.

**Diagnosis:**
```javascript
const headerLabel = document.querySelector('.tp-headv .tp-lblv_l');
const rowLabel = document.querySelector('.tp-rowv .tp-lblv_l');

console.log('Header label display:', window.getComputedStyle(headerLabel).display);
console.log('Row label display:', window.getComputedStyle(rowLabel).display);
```

**Solution:**
Ensure CSS hides labels in both:

```scss
.tp-rowv .tp-lblv_l,
.tp-headv .tp-lblv_l {
  display: none;
}
```

## Issue 3: Different Padding Between Headers and Rows

**Symptoms:**
- Cells align but text inside is offset
- Visual centering doesn't match between headers and rows

**Root Cause:**
Different padding applied to header vs row cells.

**Diagnosis:**
```javascript
const measurePadding = (el) => {
  const cs = window.getComputedStyle(el);
  return {
    padding: cs.padding,
    paddingLeft: cs.paddingLeft,
    paddingRight: cs.paddingRight,
    paddingTop: cs.paddingTop,
    paddingBottom: cs.paddingBottom
  };
};

const headerCell = document.querySelector('.tp-headv .tp-lblv');
const rowCell = document.querySelector('.tp-rowv .tp-lblv');

console.log('Header padding:', measurePadding(headerCell));
console.log('Row padding:', measurePadding(rowCell));
```

**Solution:**
Ensure consistent padding:

```scss
.tp-tablev .tp-lblv {
  padding-left: 0px;
}

.tp-tablev .tp-lblv.tp-v-lst {
  padding-right: 0px;
}
```

## Issue 4: Box-Sizing Mismatch

**Symptoms:**
- Width appears correct but cells still don't align
- Borders or padding push cells out of alignment

**Root Cause:**
Different `box-sizing` values between headers and rows.

**Diagnosis:**
```javascript
const headerCell = document.querySelector('.tp-headv .tp-lblv');
const rowCell = document.querySelector('.tp-rowv .tp-lblv');

console.log('Header box-sizing:', window.getComputedStyle(headerCell).boxSizing);
console.log('Row box-sizing:', window.getComputedStyle(rowCell).boxSizing);
```

**Solution:**
Tweakpane typically uses `border-box`. Ensure both have the same:

```scss
.tp-tablev .tp-lblv {
  box-sizing: border-box;
}
```

## Issue 5: Flex Direction Not Set on Pane

**Symptoms:**
- Cells stack vertically instead of horizontally
- No alignment issue because there's no horizontal layout

**Root Cause:**
`.tp-brkv` container doesn't have `flex-direction: row`.

**Diagnosis:**
```javascript
const headerPane = document.querySelector('.tp-headv .tp-brkv');
const rowPane = document.querySelector('.tp-rowv .tp-brkv');

console.log('Header pane flex-direction:', window.getComputedStyle(headerPane).flexDirection);
console.log('Row pane flex-direction:', window.getComputedStyle(rowPane).flexDirection);
```

**Solution:**
Set flex direction in CSS:

```scss
.tp-tablev .tp-brkv {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}
```

## Issue 6: Min-Width Constraints

**Symptoms:**
- Cells are wider than specified width
- Width property seems to be ignored

**Root Cause:**
`min-width` constraint on cell or child elements prevents shrinking.

**Diagnosis:**
```javascript
const headerCell = document.querySelector('.tp-headv .tp-lblv');
const headerValue = headerCell.querySelector('.tp-lblv_v');

console.log('Cell min-width:', window.getComputedStyle(headerCell).minWidth);
console.log('Value min-width:', window.getComputedStyle(headerValue).minWidth);
```

**Solution:**
Override min-width:

```scss
.tp-tablev .tp-lblv_v {
  min-width: auto;
}
```

## Issue 7: Width Applied But Not Visible

**Symptoms:**
- Inline style shows correct width
- Computed style shows different width
- Flex basis is correct but element is still wrong size

**Root Cause:**
Parent container doesn't constrain children, or flex-grow overrides flex-basis.

**Diagnosis:**
```javascript
const cell = document.querySelector('.tp-headv .tp-lblv');
const cs = window.getComputedStyle(cell);

console.log('Inline flex:', cell.style.flex);
console.log('Computed flex:', cs.flex);
console.log('Computed flex-basis:', cs.flexBasis);
console.log('Computed flex-grow:', cs.flexGrow);
console.log('Computed flex-shrink:', cs.flexShrink);
console.log('Computed width:', cs.width);
console.log('Actual width:', cell.getBoundingClientRect().width);
```

**Solution:**
Ensure `flex-grow` and `flex-shrink` are both 0:

```javascript
api.element.style.flex = `0 0 ${width}`;
```

## Issue 8: Headers Use Different Element Type

**Symptoms:**
- Headers are buttons while cells are inputs
- Different baseline alignment
- Different default sizing

**Root Cause:**
Headers created with different blade type than rows.

**Diagnosis:**
```javascript
const headerInput = document.querySelector('.tp-headv input, .tp-headv button');
const rowInput = document.querySelector('.tp-rowv input, .tp-rowv button, .tp-rowv select');

console.log('Header element type:', headerInput?.tagName);
console.log('Row element type:', rowInput?.tagName);
```

**Solution:**
Use the same element type. For tweakpane-table, headers should use readonly text bindings:

```javascript
// In src/head.ts
const headerObj = { value: headerParams.label };
const api = this.headers.addBinding(headerObj, 'value', {
  readonly: true,
  label: ''
});
```

## Debugging Workflow

For any alignment issue:

1. **Visual Inspection**
   - Take screenshot with Playwright
   - Measure pixel differences between columns

2. **DOM Structure**
   - Compare header vs row hierarchy depth
   - Verify same element types at each level

3. **CSS Properties**
   - Compare computed styles of header vs row cells
   - Check flex, width, padding, margin, box-sizing

4. **Inline Styles**
   - Verify width/flex is applied to correct elements
   - Check that inline styles match between headers and rows

5. **Parent Containers**
   - Verify `.tp-brkv` has `flex-direction: row`
   - Check for constraints on parent elements

6. **Fix & Test**
   - Apply fix to CSS or JavaScript
   - Rebuild: `npm run build:dev`
   - Reload page and re-measure

## Prevention Checklist

When implementing new table features:

- [ ] Apply width/flex to same element in both headers and rows
- [ ] Use `flex: 0 0 {width}` not just `width`
- [ ] Hide labels in both headers and rows
- [ ] Use same element types (readonly text bindings)
- [ ] Ensure same padding/margin/border
- [ ] Verify same box-sizing
- [ ] Test with different width values
- [ ] Test with many columns
- [ ] Measure actual dimensions with browser tools
