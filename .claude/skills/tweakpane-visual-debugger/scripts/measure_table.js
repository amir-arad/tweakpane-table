/**
 * Comprehensive table measurement script for tweakpane-table plugin
 *
 * This script measures dimensions, positions, and CSS properties of all
 * table cells (both headers and data rows) to identify alignment issues.
 *
 * Usage in Playwright:
 *   mcp__playwright__browser_evaluate with function: `${fs.readFileSync('measure_table.js', 'utf8')}`
 *
 * Returns: Object with detailed measurements for headers and rows
 */

(() => {
  const measureElement = (el, type, index) => {
    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);

    // Get child elements
    const labelEl = el.querySelector('.tp-lblv_l');
    const valueEl = el.querySelector('.tp-lblv_v');

    const labelRect = labelEl ? labelEl.getBoundingClientRect() : null;
    const valueRect = valueEl ? valueEl.getBoundingClientRect() : null;
    const labelComputed = labelEl ? window.getComputedStyle(labelEl) : null;
    const valueComputed = valueEl ? window.getComputedStyle(valueEl) : null;

    return {
      type,
      index,
      // Element info
      classes: Array.from(el.classList),
      tagName: el.tagName,

      // Dimensions
      dimensions: {
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom
      },

      // CSS properties
      css: {
        display: computed.display,
        position: computed.position,
        flex: computed.flex,
        flexGrow: computed.flexGrow,
        flexShrink: computed.flexShrink,
        flexBasis: computed.flexBasis,
        width: computed.width,
        minWidth: computed.minWidth,
        maxWidth: computed.maxWidth,
        padding: computed.padding,
        paddingLeft: computed.paddingLeft,
        paddingRight: computed.paddingRight,
        margin: computed.margin,
        marginLeft: computed.marginLeft,
        marginRight: computed.marginRight,
        border: computed.border,
        borderLeft: computed.borderLeft,
        borderRight: computed.borderRight,
        boxSizing: computed.boxSizing
      },

      // Inline styles
      inlineStyles: {
        width: el.style.width,
        flex: el.style.flex,
        minWidth: el.style.minWidth,
        maxWidth: el.style.maxWidth
      },

      // Child elements (label and value)
      label: labelEl ? {
        dimensions: {
          width: labelRect.width,
          height: labelRect.height,
          x: labelRect.x,
          y: labelRect.y
        },
        css: {
          display: labelComputed.display,
          flex: labelComputed.flex,
          width: labelComputed.width,
          minWidth: labelComputed.minWidth
        }
      } : null,

      value: valueEl ? {
        dimensions: {
          width: valueRect.width,
          height: valueRect.height,
          x: valueRect.x,
          y: valueRect.y
        },
        css: {
          display: valueComputed.display,
          flex: valueComputed.flex,
          flexGrow: valueComputed.flexGrow,
          flexShrink: valueComputed.flexShrink,
          flexBasis: valueComputed.flexBasis,
          width: valueComputed.width,
          minWidth: valueComputed.minWidth,
          maxWidth: valueComputed.maxWidth
        }
      } : null
    };
  };

  // Find all table elements
  const headers = Array.from(document.querySelectorAll('.tp-headv'));
  const rows = Array.from(document.querySelectorAll('.tp-rowv'));

  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      headerCount: headers.length,
      rowCount: rows.length
    },
    headers: [],
    rows: []
  };

  // Measure each header
  headers.forEach((header, headerIndex) => {
    const headerPane = header.querySelector('.tp-brkv');
    const headerCells = headerPane ? Array.from(headerPane.querySelectorAll('.tp-lblv')) : [];

    const headerData = {
      index: headerIndex,
      label: header.querySelector('.tp-lblv_l')?.textContent || '(no label)',
      containerClasses: Array.from(header.classList),
      pane: headerPane ? {
        classes: Array.from(headerPane.classList),
        css: {
          display: window.getComputedStyle(headerPane).display,
          flexDirection: window.getComputedStyle(headerPane).flexDirection,
          width: window.getComputedStyle(headerPane).width
        }
      } : null,
      cells: headerCells.map((cell, i) => measureElement(cell, 'header', i))
    };

    results.headers.push(headerData);
  });

  // Measure each row
  rows.forEach((row, rowIndex) => {
    const rowPane = row.querySelector('.tp-brkv');
    const rowCells = rowPane ? Array.from(rowPane.querySelectorAll('.tp-lblv')) : [];

    const rowData = {
      index: rowIndex,
      label: row.querySelector('.tp-lblv_l')?.textContent || '(no label)',
      containerClasses: Array.from(row.classList),
      pane: rowPane ? {
        classes: Array.from(rowPane.classList),
        css: {
          display: window.getComputedStyle(rowPane).display,
          flexDirection: window.getComputedStyle(rowPane).flexDirection,
          width: window.getComputedStyle(rowPane).width
        }
      } : null,
      cells: rowCells.map((cell, i) => measureElement(cell, 'row', i))
    };

    results.rows.push(rowData);
  });

  // Calculate alignment differences
  if (results.headers.length > 0 && results.rows.length > 0) {
    const headerCells = results.headers[0].cells;
    const firstRowCells = results.rows[0].cells;

    results.alignment = {
      columnsMatch: headerCells.length === firstRowCells.length,
      columnCount: {
        headers: headerCells.length,
        firstRow: firstRowCells.length
      },
      widthDifferences: []
    };

    const minCells = Math.min(headerCells.length, firstRowCells.length);
    for (let i = 0; i < minCells; i++) {
      const headerWidth = headerCells[i].dimensions.width;
      const rowWidth = firstRowCells[i].dimensions.width;
      const diff = Math.abs(headerWidth - rowWidth);

      results.alignment.widthDifferences.push({
        columnIndex: i,
        headerWidth,
        rowWidth,
        difference: diff,
        aligned: diff < 1 // Consider aligned if less than 1px difference
      });
    }
  }

  return results;
})();
