import { tableHeadPlugin } from './head';
import { tableRowPlugin } from './row';

// Export your plugin(s) as constant `plugins`
export const plugins = [tableHeadPlugin, tableRowPlugin().plugin];
