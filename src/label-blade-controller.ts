import { Blade, BladeController, BladeState, Controller, LabelProps, Rack, View } from '@tweakpane/core';

export interface LabelBladeControllerConfig<C extends Controller> {
	blade: Blade;
	props: LabelProps;
	valueController: C;
}

export class LabelBladeController<C extends Controller> extends BladeController<View> {
	readonly blade: Blade;
	constructor(doc: Document, config: LabelBladeControllerConfig<C>) {
		super(doc, config);
		this.blade = config.blade;
	}
	get parent(): Rack | null {
		throw new Error('Method not implemented.');
	}
	set parent(parent: Rack | null) {
		throw new Error('Method not implemented.');
	}
	importState(state: BladeState): boolean {
		throw new Error('Method not implemented.');
	}
	exportState(): BladeState {
		throw new Error('Method not implemented.');
	}
}

// LabelController<C> implements
