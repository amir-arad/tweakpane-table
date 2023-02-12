import {
	BaseBladeParams,
	BladeApi,
	ClassName,
	Controller,
	LabelController,
	PluginPool,
	View,
	ViewProps,
} from '@tweakpane/core';

import { Pane } from 'tweakpane';

export class Row extends Pane {
	get pool(): PluginPool {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		return this.pool_;
	}
}

interface Config {
	viewProps: ViewProps;
}

// Custom controller class should implement `Controller` interface
export class PluginController implements Controller<PluginView> {
	public readonly view: PluginView;
	public readonly viewProps: ViewProps;
	public readonly row: Row;

	constructor(doc: Document, config: Config, bladesParams: BaseBladeParams[]) {
		// Receive the bound value from the plugin

		// and also view props
		this.viewProps = config.viewProps;
		this.viewProps.handleDispose(() => {
			// Called when the controller is disposing
			console.log('TODO: dispose controller');
		});

		// Create a custom view
		this.view = new PluginView(doc, {
			viewProps: this.viewProps,
		});
		this.row = new Row({ container: this.view.element });
		for (const bp of bladesParams) {
			this.row.addBlade(bp);
		}
	}
}

export class MultiBladeApi extends BladeApi<LabelController<PluginController>> {}

// Create a class name generator from the view name
// ClassName('tmp') will generate a CSS class name like `tp-tmpv`
const className = ClassName('tmp');

// Custom view class should implement `View` interface
export class PluginView implements View {
	public readonly element: HTMLElement;

	constructor(doc: Document, config: Config) {
		// Create a root element for the plugin
		this.element = doc.createElement('div');
		this.element.classList.add(className());
		// Bind view props to the element
		config.viewProps.bindClassModifiers(this.element);

		config.viewProps.handleDispose(() => {
			// Called when the view is disposing
			console.log('TODO: dispose view');
		});
	}
}
