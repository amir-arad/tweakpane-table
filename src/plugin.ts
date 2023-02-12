import {
	BaseBladeParams,
	BladePlugin,
	LabelController,
	LabelPropsObject,
	ParamsParsers,
	ValueMap,
	parseParams,
} from '@tweakpane/core';
import { MultiBladeApi, PluginController } from './mvc';

export interface PluginInputParams extends BaseBladeParams {
	view: 'multiblade';
	label: string;
	blades: Array<BaseBladeParams>; // TODO 'cells'
}

export function multiBladePlugin(id: string) {
	const plugin: BladePlugin<PluginInputParams> = {
		id,
		type: 'blade',
		// This plugin template injects a compiled CSS by @rollup/plugin-replace
		// See rollup.config.js for details
		css: '__css__',

		accept(params: Record<string, unknown>) {
			// Parse parameters object
			const p = ParamsParsers;
			const result = parseParams<PluginInputParams>(params, {
				// `view` option may be useful to provide a custom control for primitive values
				view: p.required.constant('multiblade'), // TODO: custom view id
				label: p.required.string,
				blades: p.required.array(p.required.custom<BaseBladeParams>((p) => p as BaseBladeParams)), // TODO validate against plugin pool
			});
			return result ? { params: result } : null;
		},
		controller(args) {
			// // Create a controller for the plugin
			// return new PluginController(args.document, {
			// 	value: args.value,
			// 	viewProps: args.viewProps,
			// });
			return new LabelController(args.document, {
				blade: args.blade,
				props: ValueMap.fromObject<LabelPropsObject>({
					label: args.params.label,
				}),
				valueController: new PluginController(args.document, { viewProps: args.viewProps }, args.params.blades),
			});
		},

		api(args) {
			if (!(args.controller instanceof LabelController)) {
				return null;
			}
			if (!(args.controller.valueController instanceof PluginController)) {
				return null;
			}
			return new MultiBladeApi(args.controller);
		},
	};
	return {
		plugin,
	};
}

// NOTE: You can see JSDoc comments of `InputBindingPlugin` for details about each property
//
// `InputBindingPlugin<In, Ex, P>` means...
// - The plugin receives the bound value as `Ex`,
// - converts `Ex` into `In` and holds it
// - P is the type of the parsed parameters
//
export const TemplateInputPlugin: BladePlugin<PluginInputParams> = {
	id: 'multiblade',

	// type: The plugin type.
	// - 'input': Input binding
	// - 'monitor': Monitor binding
	// - 'blade': blade binding
	type: 'blade',

	// This plugin template injects a compiled CSS by @rollup/plugin-replace
	// See rollup.config.js for details
	css: '__css__',

	accept(params: Record<string, unknown>) {
		// Parse parameters object
		const p = ParamsParsers;
		const result = parseParams<PluginInputParams>(params, {
			// `view` option may be useful to provide a custom control for primitive values
			view: p.required.constant('multiblade'),
			label: p.required.string,
			blades: p.required.array(p.required.custom<BaseBladeParams>((p) => p as BaseBladeParams)),
		});
		return result ? { params: result } : null;
	},

	// binding: {
	// 	reader(_args) {
	// 		return (exValue: unknown): number => {
	// 			// Convert an external unknown value into the internal value
	// 			return typeof exValue === 'number' ? exValue : 0;
	// 		};
	// 	},

	// 	constraint(args) {
	// 		// Create a value constraint from the user input
	// 		const constraints = [];
	// 		// You can reuse existing functions of the default plugins
	// 		const cr = createRangeConstraint(args.params);
	// 		if (cr) {
	// 			constraints.push(cr);
	// 		}
	// 		const cs = createStepConstraint(args.params);
	// 		if (cs) {
	// 			constraints.push(cs);
	// 		}
	// 		// Use `CompositeConstraint` to combine multiple constraints
	// 		return new CompositeConstraint(constraints);
	// 	},

	// 	writer(_args) {
	// 		return (target: BindingTarget, inValue) => {
	// 			// Use `target.write()` to write the primitive value to the target,
	// 			// or `target.writeProperty()` to write a property of the target
	// 			target.write(inValue);
	// 		};
	// 	},
	// },

	controller(args) {
		// // Create a controller for the plugin
		// return new PluginController(args.document, {
		// 	value: args.value,
		// 	viewProps: args.viewProps,
		// });
		return new LabelController(args.document, {
			blade: args.blade,
			props: ValueMap.fromObject<LabelPropsObject>({
				label: args.params.label,
			}),
			valueController: new PluginController(args.document, { viewProps: args.viewProps }, []),
		});
	},

	api(args) {
		if (!(args.controller instanceof LabelController)) {
			return null;
		}
		if (!(args.controller.valueController instanceof PluginController)) {
			return null;
		}
		return new MultiBladeApi(args.controller);
	},
};
