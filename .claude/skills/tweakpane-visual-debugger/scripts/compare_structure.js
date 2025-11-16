/**
 * DOM structure comparison script for tweakpane-table plugin
 *
 * This script compares the DOM hierarchy between header and row elements
 * to identify structural differences that might cause alignment issues.
 *
 * Usage in Playwright:
 *   mcp__playwright__browser_evaluate with function: `${fs.readFileSync('compare_structure.js', 'utf8')}`
 *
 * Returns: Object with hierarchical structure comparison
 */

(() => {
  const getHierarchy = (el, depth = 0, maxDepth = 5) => {
    if (!el || depth > maxDepth) return null;

    const rect = el.getBoundingClientRect();
    const computed = window.getComputedStyle(el);

    const node = {
      depth,
      tag: el.tagName,
      classes: Array.from(el.classList),
      id: el.id || null,
      textContent: el.childNodes.length === 1 && el.childNodes[0].nodeType === 3
        ? el.textContent.trim().substring(0, 50)
        : null,

      dimensions: {
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y
      },

      css: {
        display: computed.display,
        position: computed.position,
        flex: computed.flex,
        flexDirection: computed.flexDirection,
        flexWrap: computed.flexWrap,
        width: computed.width,
        minWidth: computed.minWidth,
        maxWidth: computed.maxWidth,
        padding: computed.padding,
        margin: computed.margin,
        boxSizing: computed.boxSizing
      },

      inlineStyles: {
        width: el.style.width || null,
        flex: el.style.flex || null,
        minWidth: el.style.minWidth || null,
        maxWidth: el.style.maxWidth || null
      },

      childCount: el.children.length,
      children: []
    };

    // Recursively process children
    Array.from(el.children).forEach(child => {
      const childNode = getHierarchy(child, depth + 1, maxDepth);
      if (childNode) {
        node.children.push(childNode);
      }
    });

    return node;
  };

  const comparePaths = (path1, path2) => {
    const differences = [];
    const maxLen = Math.max(path1.length, path2.length);

    for (let i = 0; i < maxLen; i++) {
      const node1 = path1[i];
      const node2 = path2[i];

      if (!node1) {
        differences.push({
          level: i,
          issue: 'header_missing',
          description: `Row has extra level: ${node2.tag}.${node2.classes.join('.')}`
        });
      } else if (!node2) {
        differences.push({
          level: i,
          issue: 'row_missing',
          description: `Header has extra level: ${node1.tag}.${node1.classes.join('.')}`
        });
      } else {
        // Compare tags
        if (node1.tag !== node2.tag) {
          differences.push({
            level: i,
            issue: 'tag_mismatch',
            header: node1.tag,
            row: node2.tag
          });
        }

        // Compare classes
        const classes1 = new Set(node1.classes);
        const classes2 = new Set(node2.classes);
        const onlyInHeader = [...classes1].filter(c => !classes2.has(c));
        const onlyInRow = [...classes2].filter(c => !classes1.has(c));

        if (onlyInHeader.length > 0 || onlyInRow.length > 0) {
          differences.push({
            level: i,
            issue: 'class_mismatch',
            onlyInHeader,
            onlyInRow
          });
        }

        // Compare CSS properties that affect layout
        const cssProps = ['display', 'position', 'flex', 'flexDirection'];
        cssProps.forEach(prop => {
          if (node1.css[prop] !== node2.css[prop]) {
            differences.push({
              level: i,
              issue: 'css_mismatch',
              property: prop,
              header: node1.css[prop],
              row: node2.css[prop]
            });
          }
        });
      }
    }

    return differences;
  };

  const getPathToCells = (container) => {
    const pane = container.querySelector('.tp-brkv');
    if (!pane) return [];

    const cell = pane.querySelector('.tp-lblv');
    if (!cell) return [];

    const path = [];
    let current = cell;

    while (current && current !== container) {
      path.unshift({
        tag: current.tagName,
        classes: Array.from(current.classList),
        css: {
          display: window.getComputedStyle(current).display,
          position: window.getComputedStyle(current).position,
          flex: window.getComputedStyle(current).flex,
          flexDirection: window.getComputedStyle(current).flexDirection
        }
      });
      current = current.parentElement;
    }

    return path;
  };

  // Find first header and first row
  const header = document.querySelector('.tp-headv');
  const row = document.querySelector('.tp-rowv');

  if (!header || !row) {
    return {
      error: 'Missing elements',
      found: {
        header: !!header,
        row: !!row
      }
    };
  }

  const results = {
    timestamp: new Date().toISOString(),

    // Full hierarchies
    headerStructure: getHierarchy(header),
    rowStructure: getHierarchy(row),

    // Paths to first cell in each
    pathToCell: {
      header: getPathToCells(header),
      row: getPathToCells(row)
    },

    // Comparison
    differences: null
  };

  // Compare the paths
  results.differences = comparePaths(
    results.pathToCell.header,
    results.pathToCell.row
  );

  // Add summary
  results.summary = {
    identical: results.differences.length === 0,
    differenceCount: results.differences.length,
    criticalIssues: results.differences.filter(d =>
      d.issue === 'tag_mismatch' ||
      d.issue === 'header_missing' ||
      d.issue === 'row_missing'
    ).length
  };

  return results;
})();
