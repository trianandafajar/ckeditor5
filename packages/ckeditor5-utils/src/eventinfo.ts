/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module utils/eventinfo
 */

import spy from './spy';

/**
 * The event object passed to event callbacks. It is used to provide information about the event as well as a tool to
 * manipulate it.
 */
export default class EventInfo<TName extends string = string, TReturn = unknown> {
	/**
	 * The object that fired the event.
	 *
	 * @readonly
	 * @member {Object}
	 */
	public readonly source: object;

	/**
	 * The event name.
	 *
	 * @readonly
	 * @member {String}
	 */
	public readonly name: TName;

	/**
	 * Path this event has followed. See {@link module:utils/emittermixin~EmitterMixin#delegate}.
	 *
	 * @readonly
	 * @member {Array.<Object>}
	 */
	public path: Array<object>;

	/**
	 * Stops the event emitter to call further callbacks for this event interaction.
	 *
	 * @method #stop
	 */
	public readonly stop: { (): void; called?: boolean };

	/**
	 * Removes the current callback from future interactions of this event.
	 *
	 * @method #off
	 */
	public readonly off: { (): void; called?: boolean };

	/**
	 * The value which will be returned by {@link module:utils/emittermixin~EmitterMixin#fire}.
	 *
	 * It's `undefined` by default and can be changed by an event listener:
	 *
	 *		dataController.fire( 'getSelectedContent', ( evt ) => {
	 *			// This listener will make `dataController.fire( 'getSelectedContent' )`
	 *			// always return an empty DocumentFragment.
	 *			evt.return = new DocumentFragment();
	 *
	 *			// Make sure no other listeners are executed.
	 *			evt.stop();
	 *		} );
	 *
	 * @member #return
	 */
	public return: TReturn | undefined;

	/**
	 * @param {Object} source The emitter.
	 * @param {String} name The event name.
	 */
	constructor( source: object, name: TName ) {
		this.source = source;
		this.name = name;
		this.path = [];

		// The following methods are defined in the constructor because they must be re-created per instance.
		this.stop = spy();
		this.off = spy();
	}
}
