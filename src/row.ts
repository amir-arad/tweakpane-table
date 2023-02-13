import {
	BaseBladeParams,
	BladeApi,
	BladePlugin,
	ClassName,
	Controller,
	LabelController,
	LabelPropsObject,
	ParamsParsers,
	PluginPool,
	ValueMap,
	View,
	ViewProps,
	parseParams,
} from '@tweakpane/core';

import { Pane } from 'tweakpane';

export interface RowInputParams extends BaseBladeParams {
	view: 'tableRow';
	label: string;
	cells: Array<CellBladeParams>;
}

export interface CellBladeParams extends BaseBladeParams {
	width?: string;
}

export function tableRowPlugin() {
	const plugin: BladePlugin<RowInputParams> = {
		id: 'tableRowPlugin',
		type: 'blade',
		// This plugin template injects a compiled CSS by @rollup/plugin-replace
		// See rollup.config.js for details
		css: '__css__',

		accept(params: Record<string, unknown>) {
			const p = ParamsParsers;
			const result = parseParams<RowInputParams>(params, {
				view: p.required.constant('tableRow'),
				label: p.required.string,
				cells: p.required.array(p.required.custom<BaseBladeParams>((p) => p as BaseBladeParams)), // TODO validate against plugin pool
			});
			return result ? { params: result } : null;
		},
		controller(args) {
			return new LabelController(args.document, {
				blade: args.blade,
				props: ValueMap.fromObject<LabelPropsObject>({
					label: args.params.label,
				}),
				valueController: new RowController(args.document, { viewProps: args.viewProps }, args.params.cells),
			});
		},

		api(args) {
			if (!(args.controller instanceof LabelController)) {
				return null;
			}
			if (!(args.controller.valueController instanceof RowController)) {
				return null;
			}
			return new RowApi(args.controller);
		},
	};
	return {
		plugin,
	};
}

export class Cells extends Pane {
	get pool(): PluginPool {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return this.pool_;
	}
}

interface RowConfig {
	viewProps: ViewProps;
}

// Custom controller class should implement `Controller` interface
export class RowController implements Controller<RowView> {
	public readonly view: RowView;
	public readonly viewProps: ViewProps;
	public readonly cells: Cells;

	constructor(doc: Document, config: RowConfig, cellsParams: CellBladeParams[]) {
		// Receive the bound value from the plugin

		// and also view props
		this.viewProps = config.viewProps;
		// Create a custom view
		this.view = new RowView(doc, {
			viewProps: this.viewProps,
		});
		this.cells = new Cells({ container: this.view.element });
		for (const cellParams of cellsParams) {
			const api = this.cells.addBlade(cellParams);
			if (cellParams.width) {
				api.element.style.width = cellParams.width;
			}
		}
		this.viewProps.handleDispose(() => {
			this.cells.dispose();
		});
	}
}

export class RowApi extends BladeApi<LabelController<RowController>> {}

// Create a class name generator from the view name
// ClassName('tmp') will generate a CSS class name like `tp-tmpv`
const className = ClassName('row');

// Custom view class should implement `View` interface
export class RowView implements View {
	public readonly element: HTMLElement;

	constructor(doc: Document, config: RowConfig) {
		// Create a root element for the plugin
		this.element = doc.createElement('div');
		this.element.classList.add(className());
		// Bind view props to the element
		config.viewProps.bindClassModifiers(this.element);
	}
}
