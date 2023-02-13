import {
	BaseBladeParams,
	BladeApi,
	BladePlugin,
	ClassName,
	Controller,
	LabelController,
	LabelPropsObject,
	ParamsParsers,
	ValueMap,
	View,
	ViewProps,
	parseParams,
} from '@tweakpane/core';

import { Pane } from 'tweakpane';

export interface TableHeadParams extends BaseBladeParams {
	view: 'tableHead';
	label: string;
	headers: Array<HeaderParams>;
}

export interface HeaderParams {
	label: string;
	width?: string;
}

export const tableHeadPlugin: BladePlugin<TableHeadParams> = {
	id: 'tableHeadPlugin',
	type: 'blade',
	// This plugin template injects a compiled CSS by @rollup/plugin-replace
	// See rollup.config.js for details
	css: '__css__',

	accept(params: Record<string, unknown>) {
		const p = ParamsParsers;
		const result = parseParams<TableHeadParams>(params, {
			view: p.required.constant('tableHead'),
			label: p.required.string,
			headers: p.required.array(
				p.required.object({
					label: p.required.string,
					width: p.optional.string,
				})
			),
		});
		return result ? { params: result } : null;
	},
	controller(args) {
		return new LabelController(args.document, {
			blade: args.blade,
			props: ValueMap.fromObject<LabelPropsObject>({
				label: args.params.label,
			}),
			valueController: new TableHeadController(args.document, { viewProps: args.viewProps }, args.params.headers),
		});
	},

	api(args) {
		if (!(args.controller instanceof LabelController)) {
			return null;
		}
		if (!(args.controller.valueController instanceof TableHeadController)) {
			return null;
		}
		return new BladeApi<LabelController<TableHeadController>>(args.controller);
	},
};

interface HeadConfig {
	viewProps: ViewProps;
}

// Custom controller class should implement `Controller` interface
export class TableHeadController implements Controller<HeadView> {
	public readonly view: HeadView;
	public readonly viewProps: ViewProps;
	public readonly headers: Pane;

	constructor(doc: Document, config: HeadConfig, headersParams: HeaderParams[]) {
		// Receive the bound value from the plugin

		// and also view props
		this.viewProps = config.viewProps;
		// Create a custom view
		this.view = new HeadView(doc, {
			viewProps: this.viewProps,
		});
		this.headers = new Pane({ container: this.view.element });
		for (const headerParams of headersParams) {
			const api = this.headers.addInput({ [headerParams.label]: true }, headerParams.label);
			if (headerParams.width) {
				api.element.style.width = headerParams.width;
			}
		}
		this.viewProps.handleDispose(() => {
			this.headers.dispose();
		});
	}
}

// Create a class name generator from the view name
// ClassName('tmp') will generate a CSS class name like `tp-tmpv`
const className1 = ClassName('table');
const className2 = ClassName('head');

// Custom view class should implement `View` interface
export class HeadView implements View {
	public readonly element: HTMLElement;

	constructor(doc: Document, config: HeadConfig) {
		// Create a root element for the plugin
		this.element = doc.createElement('div');
		this.element.classList.add(className1(), className2());
		// Bind view props to the element
		config.viewProps.bindClassModifiers(this.element);
	}
}
