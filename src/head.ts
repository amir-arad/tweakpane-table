import {
	BaseBladeParams,
	Blade,
	BladeApi,
	BladeController,
	BladePlugin,
	ClassName,
	View,
	ViewProps,
	createPlugin,
	parseRecord,
} from '@tweakpane/core';

import { applyWidth } from './util';

export interface TableHeadParams extends BaseBladeParams {
	view: 'tableHead';
	label: string;
	headers: Array<HeaderParams>;
}

export interface HeaderParams {
	label: string;
	width?: string;
}

export const tableHeadPlugin: BladePlugin<TableHeadParams> = createPlugin({
	id: 'tableHead',
	type: 'blade',

	accept(params: Record<string, unknown>) {
		const result = parseRecord<TableHeadParams>(params, (p) => ({
			view: p.required.constant('tableHead'),
			label: p.required.string,
			headers: p.required.array(
				p.required.object({
					label: p.required.string,
					width: p.optional.string,
				})
			),
		}));
		return result ? { params: result } : null;
	},
	controller(args) {
		return new TableHeadController(args.document, {
			blade: args.blade,
			viewProps: args.viewProps,
			label: args.params.label,
			headers: args.params.headers,
		});
	},

	api({ controller }) {
		if (!(controller instanceof TableHeadController)) {
			return null;
		}
		return new HeadApi(controller);
	},
});

export class HeadApi extends BladeApi<TableHeadController> {
	/**
	 * Get the element for a specific header cell
	 * @param i - Index of the header cell
	 * @returns The HTMLElement for the header cell
	 */
	getCell(i: number): HTMLElement | undefined {
		return this.controller.cellElements[i];
	}
}

interface HeadConfig {
	blade: Blade;
	viewProps: ViewProps;
	label: string;
	headers: HeaderParams[];
}

// Custom controller class extends BladeController (v4 pattern)
export class TableHeadController extends BladeController<HeadView> {
	public readonly cellElements: HTMLElement[] = [];

	constructor(doc: Document, config: HeadConfig) {
		const view = new HeadView(doc, {
			viewProps: config.viewProps,
			label: config.label,
			headers: config.headers,
		});

		super({ blade: config.blade, view, viewProps: config.viewProps });

		// Store references to cell elements
		this.cellElements = view.cellElements;
	}
}

// Create a class name generator from the view name
const className1 = ClassName('table');
const className2 = ClassName('head');
const cellClassName = ClassName('headc'); // tp-headcv for header cells

interface HeadViewConfig {
	viewProps: ViewProps;
	label: string;
	headers: HeaderParams[];
}

// Custom view class implements View interface
// Creates a horizontal container with simple text labels (no bindings needed)
export class HeadView implements View {
	public readonly element: HTMLElement;
	public readonly cellElements: HTMLElement[] = [];

	constructor(doc: Document, config: HeadViewConfig) {
		// Create outer container with label
		const container = doc.createElement('div');
		container.classList.add('tp-lblv'); // Use Tweakpane's label container class

		// Create label element
		const labelEl = doc.createElement('div');
		labelEl.classList.add('tp-lblv_l');
		labelEl.textContent = config.label;
		container.appendChild(labelEl);

		// Create value container
		const valueEl = doc.createElement('div');
		valueEl.classList.add('tp-lblv_v');

		// Create horizontal header container
		const headerContainer = doc.createElement('div');
		headerContainer.classList.add(className1(), className2());
		config.viewProps.bindClassModifiers(headerContainer);

		// Create header cells
		for (const headerParams of config.headers) {
			const cellWrapper = doc.createElement('div');
			cellWrapper.classList.add(cellClassName());

			// Create simple text element for the header
			const textEl = doc.createElement('div');
			textEl.classList.add(cellClassName('t')); // tp-headcv_t for text
			textEl.textContent = headerParams.label;
			cellWrapper.appendChild(textEl);

			// Apply width if specified
			applyWidth(cellWrapper, headerParams.width);

			headerContainer.appendChild(cellWrapper);
			this.cellElements.push(cellWrapper);
		}

		valueEl.appendChild(headerContainer);
		container.appendChild(valueEl);

		this.element = container;
	}
}
