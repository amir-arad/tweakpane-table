import { tableHeadPlugin } from './head';
import { tableRowPlugin } from './row';

export * from './head';
export * from './row';
// Export your plugin(s) as constant `plugins`
export const plugins = [tableHeadPlugin, tableRowPlugin];
