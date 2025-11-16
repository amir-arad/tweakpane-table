import { tableHeadPlugin } from './head';
import { tableRowPlugin } from './row';

export * from './head';
export * from './row';

// Version export for runtime detection
export const VERSION = '0.4.0';

// Export plugin bundle for Tweakpane v4
const plugin = {
	id: 'table',
	plugins: [tableHeadPlugin, tableRowPlugin],
	css: '__css__',
};

// Named export for package users
export const plugins = plugin;
