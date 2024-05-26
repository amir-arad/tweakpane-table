import {
	BaseBladeParams,
	Bindable,
	BindingApi,
	BindingParams,
	BladeApi,
	BladeController,
	BladePlugin,
	ButtonApi,
	ButtonParams,
	ClassName,
	Controller,
	LabelController,
	LabelPropsObject,
	ValueMap,
	View,
	ViewProps,
	createPlugin,
	parseRecord,
} from '@tweakpane/core';

import { Pane } from 'tweakpane';

export interface TableRowParams extends BaseBladeParams {
	view: 'tableRow';
	label: string;
	cells?: Array<CellBladeParams>;
}

export interface Width {
	width?: string;
}
export interface CellBladeParams extends BaseBladeParams, Width {}

export const tableRowPlugin = createPlugin<BladePlugin<TableRowParams>>({
	id: 'tableRowPlugin',
	type: 'blade',
	// This plugin template injects a compiled CSS by @rollup/plugin-replace
	// See rollup.config.js for details
	css: '__css__',

	accept(params: Record<string, unknown>) {
		const result = parseRecord<TableRowParams>(params, (p) => ({
			view: p.required.constant('tableRow'),
			label: p.required.string,
			cells: p.optional.array(p.required.custom<BaseBladeParams>((p) => p as BaseBladeParams)), // TODO validate against plugin pool
		}));
		return result ? { params: result } : null;
	},
	controller(args) {
		return new LabelController(args.document, {
			blade: args.blade,
			props: ValueMap.fromObject<LabelPropsObject>({
				label: args.params.label,
			}),
			valueController: new RowController(args.document, { viewProps: args.viewProps }, args.params.cells || []),
		});
	},

	api({ controller }) {
		if (!(controller instanceof LabelController)) {
			return null;
		}
		if (!(controller.valueController instanceof RowController)) {
			return null;
		}
		return new RowBladeApi(controller);
	},
});
export class RowBladeApi extends BladeApi<LabelController<RowController>> {
	getCell(i: number) {
		return this.controller_.valueController.cells.children[i];
	}
	getPane() {
		return this.controller_.valueController.cells;
	}
}
interface RowConfig {
	viewProps: ViewProps;
}

class RowPane extends Pane {
	addBinding<O extends Bindable, Key extends keyof O>(
		object: O,
		key: Key,
		opt_params?: BindingParams & Width
	): BindingApi<unknown, O[Key]> {
		const api = super.addBinding(object, key, opt_params);
		if (opt_params?.width) {
			api.element.style.width = opt_params.width;
		}
		return api;
	}
	addButton(params: ButtonParams & Width): ButtonApi {
		const api = super.addButton(params);
		if (params.width) {
			api.element.style.width = params.width;
		}
		return api;
	}
	addBlade(params: CellBladeParams): BladeApi<BladeController<View>> {
		const api = super.addBlade(params);
		if (params.width) {
			api.element.style.width = params.width;
		}
		return api;
	}
}
// Custom controller class should implement `Controller` interface
export class RowController implements Controller<RowView> {
	public readonly view: RowView;
	public readonly viewProps: ViewProps;
	public readonly cells: RowPane;

	constructor(doc: Document, config: RowConfig, cellsParams: CellBladeParams[]) {
		// Receive the bound value from the plugin

		// and also view props
		this.viewProps = config.viewProps;
		// Create a custom view
		this.view = new RowView(doc, {
			viewProps: this.viewProps,
		});
		this.cells = new RowPane({ container: this.view.element });
		for (const cellParams of cellsParams) {
			this.cells.addBlade(cellParams);
		}
		this.viewProps.handleDispose(() => {
			this.cells.dispose();
		});
	}
}

// Create a class name generator from the view name
// ClassName('tmp') will generate a CSS class name like `tp-tmpv`
const className1 = ClassName('table');
const className2 = ClassName('row');

// Custom view class should implement `View` interface
export class RowView implements View {
	public readonly element: HTMLElement;

	constructor(doc: Document, config: RowConfig) {
		// Create a root element for the plugin
		this.element = doc.createElement('div');
		this.element.classList.add(className1(), className2());
		// Bind view props to the element
		config.viewProps.bindClassModifiers(this.element);
	}
}
