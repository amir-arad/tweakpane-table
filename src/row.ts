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

type ApiArguments = BladePlugin<TableRowParams>['api'] extends (args: infer ApiArguments) => any ? ApiArguments : never;
type PluginPool = ApiArguments['pool'];

export interface TableRowParams extends BaseBladeParams {
	view: 'tableRow';
	label: string;
	cells?: Array<CellBladeParams>;
}

export interface Width {
	width?: string;
}
export type CellBladeParams = BaseBladeParams & Width;

export const tableRowPlugin: BladePlugin<TableRowParams> = createPlugin({
	id: 'tableRow',
	type: 'blade',

	accept(params: Record<string, unknown>) {
		const result = parseRecord<TableRowParams>(params, (p) => ({
			view: p.required.constant('tableRow'),
			label: p.required.string,
			cells: p.optional.array(p.required.custom<CellBladeParams>((p) => p as CellBladeParams)),
		}));
		return result ? { params: result } : null;
	},
	controller(args) {
		return new TableRowController(args.document, {
			blade: args.blade,
			viewProps: args.viewProps,
			label: args.params.label,
			cellsParams: args.params.cells || [],
		});
	},

	api({ controller, pool }) {
		if (!(controller instanceof TableRowController)) {
			return null;
		}
		// Pass the PluginPool to the controller so it can create blades dynamically
		controller.setPool(pool);
		return new RowApi(controller, pool);
	},
});

export class RowApi extends BladeApi<TableRowController> {
	private readonly pool_: PluginPool;

	constructor(controller: TableRowController, pool: PluginPool) {
		super(controller);
		this.pool_ = pool;
	}

	/**
	 * Get the API for a specific cell
	 * @param i - Index of the cell
	 * @returns The BladeApi for the cell, or undefined if not found
	 */
	getCell(i: number): BladeApi | undefined {
		return this.controller.getCellApi(i);
	}

	/**
	 * Add a cell blade to the row
	 * @param params - Parameters for the blade (binding, button, etc.) with optional width
	 * @returns The BladeApi for the created blade
	 */
	addCell(params: CellBladeParams): BladeApi {
		return this.controller.addCell(params);
	}

	/**
	 * Get all cell APIs
	 * @returns Array of BladeApi instances
	 */
	get cells(): BladeApi[] {
		return this.controller.cellApis;
	}

	/**
	 * Remove a cell from the row
	 * @param index - Index of the cell to remove
	 */
	removeCell(index: number): void {
		this.controller.removeCell(index);
	}
}

interface RowConfig {
	blade: Blade;
	viewProps: ViewProps;
	label: string;
	cellsParams: CellBladeParams[];
}

// Create a class name generator from the view name
const className1 = ClassName('table');
const className2 = ClassName('row');
const cellClassName = ClassName('rowc'); // tp-rowcv for row cells

// Custom controller class extends BladeController (v4 pattern)
export class TableRowController extends BladeController<RowView> {
	private pool_: PluginPool | null = null;
	private readonly doc_: Document;
	public readonly cellApis: BladeApi[] = [];
	private readonly cellControllers: BladeController[] = [];
	private readonly cellWrappers: HTMLElement[] = [];
	private initialCellsParams: CellBladeParams[] = [];

	constructor(doc: Document, config: RowConfig) {
		const view = new RowView(doc, {
			viewProps: config.viewProps,
			label: config.label,
		});

		super({ blade: config.blade, view, viewProps: config.viewProps });

		this.doc_ = doc;

		// Store cells params to create after pool is available
		// We can't create blades here because PluginPool isn't available yet
		this.initialCellsParams = config.cellsParams;
	}

	setPool(pool: PluginPool): void {
		this.pool_ = pool;

		// Create any pending initial cells now that pool is available
		for (const params of this.initialCellsParams) {
			this.addCell(params);
		}
		// Clear the initial params array
		this.initialCellsParams = [];
	}

	addCell(params: CellBladeParams): BladeApi {
		if (!this.pool_) {
			throw new Error('PluginPool not available. Cannot create blade.');
		}

		// Create blade controller using the plugin pool
		const bladeController = this.pool_.createBlade(this.doc_, params);
		this.cellControllers.push(bladeController);

		// Create API wrapper for the blade
		const bladeApi = this.pool_.createApi(bladeController);
		this.cellApis.push(bladeApi);

		// Create wrapper div for the cell
		const cellWrapper = this.doc_.createElement('div');
		cellWrapper.classList.add(cellClassName());
		this.cellWrappers.push(cellWrapper);

		// Apply width if specified
		applyWidth(cellWrapper, params.width);

		// Append the blade's view to the wrapper
		cellWrapper.appendChild(bladeController.view.element);

		// Add wrapper to the row container
		this.view.containerElement.appendChild(cellWrapper);

		// Handle disposal
		bladeController.viewProps.handleDispose(() => {
			const index = this.cellControllers.indexOf(bladeController);
			if (index !== -1) {
				this.cellControllers.splice(index, 1);
				this.cellApis.splice(index, 1);
				this.cellWrappers.splice(index, 1);
			}
			cellWrapper.remove();
		});

		return bladeApi;
	}

	getCellApi(i: number): BladeApi | undefined {
		return this.cellApis[i];
	}

	/**
	 * Remove a cell from the row
	 * @param index - Index of the cell to remove
	 */
	removeCell(index: number): void {
		if (index < 0 || index >= this.cellControllers.length) {
			throw new Error(`Invalid cell index: ${index}. Valid range: 0-${this.cellControllers.length - 1}`);
		}

		const wrapper = this.cellWrappers[index];

		// Remove from arrays
		this.cellControllers.splice(index, 1);
		this.cellApis.splice(index, 1);
		this.cellWrappers.splice(index, 1);

		// Remove from DOM
		wrapper.remove();
	}
}

interface RowViewConfig {
	viewProps: ViewProps;
	label: string;
}

// Custom view class implements View interface
// Creates a horizontal container for blade cells
export class RowView implements View {
	public readonly element: HTMLElement;
	public readonly containerElement: HTMLElement;

	constructor(doc: Document, config: RowViewConfig) {
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

		// Create horizontal row container
		const rowContainer = doc.createElement('div');
		rowContainer.classList.add(className1(), className2());
		config.viewProps.bindClassModifiers(rowContainer);

		valueEl.appendChild(rowContainer);
		container.appendChild(valueEl);

		this.element = container;
		this.containerElement = rowContainer;
	}
}
