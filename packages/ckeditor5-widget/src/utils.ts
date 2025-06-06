/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module widget/utils
 */

import CKEditorError from '@ckeditor/ckeditor5-utils/src/ckeditorerror';
import toArray from '@ckeditor/ckeditor5-utils/src/toarray';
import {
	findOptimalInsertionRange as engineFindOptimalInsertionRange
} from '@ckeditor/ckeditor5-engine/src/model/utils/findoptimalinsertionrange';

import HighlightStack, { type HighlightStackChangeEvent } from './highlightstack';
import { getTypeAroundFakeCaretPosition } from './widgettypearound/utils';

import IconView from '@ckeditor/ckeditor5-ui/src/icon/iconview';
import dragHandleIcon from '../theme/icons/drag-handle.svg';

import type Element from '@ckeditor/ckeditor5-engine/src/view/element';
import type { DocumentSelection, DowncastWriter, Model, Range, Selection } from '@ckeditor/ckeditor5-engine';
import type ContainerElement from '@ckeditor/ckeditor5-engine/src/view/containerelement';
import type {
	AddHighlightCallback,
	HighlightDescriptor,
	RemoveHighlightCallback
} from '@ckeditor/ckeditor5-engine/src/conversion/downcasthelpers';
import type EditableElement from '@ckeditor/ckeditor5-engine/src/view/editableelement';
import type { ObservableChangeEvent } from '@ckeditor/ckeditor5-utils/src/observablemixin';
import type { GetCallback } from '@ckeditor/ckeditor5-utils/src/emittermixin';
import type { MapperViewToModelPositionEvent } from '@ckeditor/ckeditor5-engine/src/conversion/mapper';
import type TypeCheckable from '@ckeditor/ckeditor5-engine/src/view/typecheckable';

/**
 * CSS class added to each widget element.
 *
 * @const {String}
 */
export const WIDGET_CLASS_NAME = 'ck-widget';

/**
 * CSS class added to currently selected widget element.
 *
 * @const {String}
 */
export const WIDGET_SELECTED_CLASS_NAME = 'ck-widget_selected';

/**
 * Returns `true` if given {@link module:engine/view/node~Node} is an {@link module:engine/view/element~Element} and a widget.
 *
 * @param {module:engine/view/node~Node} node
 * @returns {Boolean}
 */
export function isWidget( node: TypeCheckable ): boolean {
	if ( !node.is( 'element' ) ) {
		return false;
	}

	return !!node.getCustomProperty( 'widget' );
}

/**
 * Converts the given {@link module:engine/view/element~Element} to a widget in the following way:
 *
 * * sets the `contenteditable` attribute to `"false"`,
 * * adds the `ck-widget` CSS class,
 * * adds a custom {@link module:engine/view/element~Element#getFillerOffset `getFillerOffset()`} method returning `null`,
 * * adds a custom property allowing to recognize widget elements by using {@link ~isWidget `isWidget()`},
 * * implements the {@link ~setHighlightHandling view highlight on widgets}.
 *
 * This function needs to be used in conjunction with
 * {@link module:engine/conversion/downcasthelpers~DowncastHelpers downcast conversion helpers}
 * like {@link module:engine/conversion/downcasthelpers~DowncastHelpers#elementToElement `elementToElement()`}.
 * Moreover, typically you will want to use `toWidget()` only for `editingDowncast`, while keeping the `dataDowncast` clean.
 *
 * For example, in order to convert a `<widget>` model element to `<div class="widget">` in the view, you can define
 * such converters:
 *
 *		editor.conversion.for( 'editingDowncast' )
 *			.elementToElement( {
 *				model: 'widget',
 *				view: ( modelItem, { writer } ) => {
 *					const div = writer.createContainerElement( 'div', { class: 'widget' } );
 *
 *					return toWidget( div, writer, { label: 'some widget' } );
 *				}
 *			} );
 *
 *		editor.conversion.for( 'dataDowncast' )
 *			.elementToElement( {
 *				model: 'widget',
 *				view: ( modelItem, { writer } ) => {
 *					return writer.createContainerElement( 'div', { class: 'widget' } );
 *				}
 *			} );
 *
 * See the full source code of the widget (with a nested editable) schema definition and converters in
 * [this sample](https://github.com/ckeditor/ckeditor5-widget/blob/master/tests/manual/widget-with-nestededitable.js).
 *
 * @param {module:engine/view/element~Element} element
 * @param {module:engine/view/downcastwriter~DowncastWriter} writer
 * @param {Object} [options={}]
 * @param {String|Function} [options.label] Element's label provided to the {@link ~setLabel} function. It can be passed as
 * a plain string or a function returning a string. It represents the widget for assistive technologies (like screen readers).
 * @param {Boolean} [options.hasSelectionHandle=false] If `true`, the widget will have a selection handle added.
 * @returns {module:engine/view/element~Element} Returns the same element.
 */
export function toWidget(
	element: Element,
	writer: DowncastWriter,
	options: {
		label?: string | ( () => string );
		hasSelectionHandle?: boolean;
	} = {}
): Element {
	if ( !element.is( 'containerElement' ) ) {
		/**
		 * The element passed to `toWidget()` must be a {@link module:engine/view/containerelement~ContainerElement}
		 * instance.
		 *
		 * @error widget-to-widget-wrong-element-type
		 * @param {String} element The view element passed to `toWidget()`.
		 */
		throw new CKEditorError(
			'widget-to-widget-wrong-element-type',
			null,
			{ element }
		);
	}

	writer.setAttribute( 'contenteditable', 'false', element );

	writer.addClass( WIDGET_CLASS_NAME, element );
	writer.setCustomProperty( 'widget', true, element );
	element.getFillerOffset = getFillerOffset;

	writer.setCustomProperty( 'widgetLabel', [], element );

	if ( options.label ) {
		setLabel( element, options.label );
	}

	if ( options.hasSelectionHandle ) {
		addSelectionHandle( element, writer );
	}

	setHighlightHandling( element, writer );

	return element;
}

// Default handler for adding a highlight on a widget.
// It adds CSS class and attributes basing on the given highlight descriptor.
//
// @param {module:engine/view/element~Element} element
// @param {module:engine/conversion/downcasthelpers~HighlightDescriptor} descriptor
// @param {module:engine/view/downcastwriter~DowncastWriter} writer
function addHighlight( element: Element, descriptor: HighlightDescriptor, writer: DowncastWriter ) {
	if ( descriptor.classes ) {
		writer.addClass( toArray( descriptor.classes ), element );
	}

	if ( descriptor.attributes ) {
		for ( const key in descriptor.attributes ) {
			writer.setAttribute( key, descriptor.attributes[ key ], element );
		}
	}
}

// Default handler for removing a highlight from a widget.
// It removes CSS class and attributes basing on the given highlight descriptor.
//
// @param {module:engine/view/element~Element} element
// @param {module:engine/conversion/downcasthelpers~HighlightDescriptor} descriptor
// @param {module:engine/view/downcastwriter~DowncastWriter} writer
function removeHighlight( element: Element, descriptor: HighlightDescriptor, writer: DowncastWriter ) {
	if ( descriptor.classes ) {
		writer.removeClass( toArray( descriptor.classes ), element );
	}

	if ( descriptor.attributes ) {
		for ( const key in descriptor.attributes ) {
			writer.removeAttribute( key, element );
		}
	}
}

/**
 * Sets highlight handling methods. Uses {@link module:widget/highlightstack~HighlightStack} to
 * properly determine which highlight descriptor should be used at given time.
 *
 * @param {module:engine/view/element~Element} element
 * @param {module:engine/view/downcastwriter~DowncastWriter} writer
 * @param {Function} [add]
 * @param {Function} [remove]
 */
export function setHighlightHandling(
	element: Element,
	writer: DowncastWriter,
	add: ( element: Element, descriptor: HighlightDescriptor, writer: DowncastWriter ) => void = addHighlight,
	remove: ( element: Element, descriptor: HighlightDescriptor, writer: DowncastWriter ) => void = removeHighlight
): void {
	const stack = new HighlightStack();

	stack.on<HighlightStackChangeEvent>( 'change:top', ( evt, data ) => {
		if ( data.oldDescriptor ) {
			remove( element, data.oldDescriptor, data.writer );
		}

		if ( data.newDescriptor ) {
			add( element, data.newDescriptor, data.writer );
		}
	} );

	const addHighlightCallback: AddHighlightCallback = ( element, descriptor, writer ) => stack.add( descriptor, writer );
	const removeHighlightCallback: RemoveHighlightCallback = ( element, id, writer ) => stack.remove( id, writer );

	writer.setCustomProperty( 'addHighlight', addHighlightCallback, element );
	writer.setCustomProperty( 'removeHighlight', removeHighlightCallback, element );
}

/**
 * Sets label for given element.
 * It can be passed as a plain string or a function returning a string. Function will be called each time label is retrieved by
 * {@link ~getLabel `getLabel()`}.
 *
 * @param {module:engine/view/element~Element} element
 * @param {string|Function} labelOrCreator
 */
export function setLabel( element: Element, labelOrCreator: string | ( () => string ) ): void {
	const widgetLabel = element.getCustomProperty( 'widgetLabel' ) as Array<string | ( () => string )>;

	widgetLabel.push( labelOrCreator );
}

/**
 * Returns the label of the provided element.
 *
 * @param {module:engine/view/element~Element} element
 * @returns {String}
 */
export function getLabel( element: Element ): string {
	const widgetLabel = element.getCustomProperty( 'widgetLabel' ) as Array<string | ( () => string )>;

	return widgetLabel.reduce( ( prev: string, current: string | ( () => string ) ) => {
		if ( typeof current === 'function' ) {
			return prev ? prev + '. ' + current() : current();
		} else {
			return prev ? prev + '. ' + current : current;
		}
	}, '' );
}

/**
 * Adds functionality to the provided {@link module:engine/view/editableelement~EditableElement} to act as a widget's editable:
 *
 * * sets the `contenteditable` attribute to `true` when {@link module:engine/view/editableelement~EditableElement#isReadOnly} is `false`,
 * otherwise sets it to `false`,
 * * adds the `ck-editor__editable` and `ck-editor__nested-editable` CSS classes,
 * * adds the `ck-editor__nested-editable_focused` CSS class when the editable is focused and removes it when it is blurred.
 * * implements the {@link ~setHighlightHandling view highlight on widget's editable}.
 *
 * Similarly to {@link ~toWidget `toWidget()`} this function should be used in `editingDowncast` only and it is usually
 * used together with {@link module:engine/conversion/downcasthelpers~DowncastHelpers#elementToElement `elementToElement()`}.
 *
 * For example, in order to convert a `<nested>` model element to `<div class="nested">` in the view, you can define
 * such converters:
 *
 *		editor.conversion.for( 'editingDowncast' )
 *			.elementToElement( {
 *				model: 'nested',
 *				view: ( modelItem, { writer } ) => {
 *					const div = writer.createEditableElement( 'div', { class: 'nested' } );
 *
 *					return toWidgetEditable( nested, writer, { label: 'label for editable' } );
 *				}
 *			} );
 *
 *		editor.conversion.for( 'dataDowncast' )
 *			.elementToElement( {
 *				model: 'nested',
 *				view: ( modelItem, { writer } ) => {
 *					return writer.createContainerElement( 'div', { class: 'nested' } );
 *				}
 *			} );
 *
 * See the full source code of the widget (with nested editable) schema definition and converters in
 * [this sample](https://github.com/ckeditor/ckeditor5-widget/blob/master/tests/manual/widget-with-nestededitable.js).
 *
 * @param {module:engine/view/editableelement~EditableElement} editable
 * @param {module:engine/view/downcastwriter~DowncastWriter} writer
 * @param {Object} [options] Additional options.
 * @param {String} [options.label] Editable's label used by assistive technologies (e.g. screen readers).
 * @returns {module:engine/view/editableelement~EditableElement} Returns the same element that was provided in the `editable` parameter
 */
export function toWidgetEditable(
	editable: EditableElement,
	writer: DowncastWriter,
	options: {
		label?: string;
	} = {}
): EditableElement {
	writer.addClass( [ 'ck-editor__editable', 'ck-editor__nested-editable' ], editable );

	writer.setAttribute( 'role', 'textbox', editable );

	if ( options.label ) {
		writer.setAttribute( 'aria-label', options.label, editable );
	}

	// Set initial contenteditable value.
	writer.setAttribute( 'contenteditable', editable.isReadOnly ? 'false' : 'true', editable );

	// Bind the contenteditable property to element#isReadOnly.
	editable.on<ObservableChangeEvent<boolean>>( 'change:isReadOnly', ( evt, property, is ) => {
		writer.setAttribute( 'contenteditable', is ? 'false' : 'true', editable );
	} );

	editable.on<ObservableChangeEvent<boolean>>( 'change:isFocused', ( evt, property, is ) => {
		if ( is ) {
			writer.addClass( 'ck-editor__nested-editable_focused', editable );
		} else {
			writer.removeClass( 'ck-editor__nested-editable_focused', editable );
		}
	} );

	setHighlightHandling( editable, writer );

	return editable;
}

/**
 * Returns a model range which is optimal (in terms of UX) for inserting a widget block.
 *
 * For instance, if a selection is in the middle of a paragraph, the collapsed range before this paragraph
 * will be returned so that it is not split. If the selection is at the end of a paragraph,
 * the collapsed range after this paragraph will be returned.
 *
 * Note: If the selection is placed in an empty block, the range in that block will be returned. If that range
 * is then passed to {@link module:engine/model/model~Model#insertContent}, the block will be fully replaced
 * by the inserted widget block.
 *
 * @param {module:engine/model/selection~Selection|module:engine/model/documentselection~DocumentSelection} selection
 * The selection based on which the insertion position should be calculated.
 * @param {module:engine/model/model~Model} model Model instance.
 * @returns {module:engine/model/range~Range} The optimal range.
 */
export function findOptimalInsertionRange(
	selection: Selection | DocumentSelection,
	model: Model
): Range {
	const selectedElement = selection.getSelectedElement();

	if ( selectedElement ) {
		const typeAroundFakeCaretPosition = getTypeAroundFakeCaretPosition( selection );

		// If the WidgetTypeAround "fake caret" is displayed, use its position for the insertion
		// to provide the most predictable UX (https://github.com/ckeditor/ckeditor5/issues/7438).
		if ( typeAroundFakeCaretPosition ) {
			return model.createRange( model.createPositionAt( selectedElement, typeAroundFakeCaretPosition ) );
		}
	}

	return engineFindOptimalInsertionRange( selection, model );
}

/**
 * A util to be used in order to map view positions to correct model positions when implementing a widget
 * which renders non-empty view element for an empty model element.
 *
 * For example:
 *
 *		// Model:
 *		<placeholder type="name"></placeholder>
 *
 *		// View:
 *		<span class="placeholder">name</span>
 *
 * In such case, view positions inside `<span>` cannot be correct mapped to the model (because the model element is empty).
 * To handle mapping positions inside `<span class="placeholder">` to the model use this util as follows:
 *
 *		editor.editing.mapper.on(
 *			'viewToModelPosition',
 *			viewToModelPositionOutsideModelElement( model, viewElement => viewElement.hasClass( 'placeholder' ) )
 *		);
 *
 * The callback will try to map the view offset of selection to an expected model position.
 *
 * 1. When the position is at the end (or in the middle) of the inline widget:
 *
 *		// View:
 *		<p>foo <span class="placeholder">name|</span> bar</p>
 *
 *		// Model:
 *		<paragraph>foo <placeholder type="name"></placeholder>| bar</paragraph>
 *
 * 2. When the position is at the beginning of the inline widget:
 *
 *		// View:
 *		<p>foo <span class="placeholder">|name</span> bar</p>
 *
 *		// Model:
 *		<paragraph>foo |<placeholder type="name"></placeholder> bar</paragraph>
 *
 * @param {module:engine/model/model~Model} model Model instance on which the callback operates.
 * @param {Function} viewElementMatcher Function that is passed a view element and should return `true` if the custom mapping
 * should be applied to the given view element.
 * @return {Function}
 */
export function viewToModelPositionOutsideModelElement(
	model: Model,
	viewElementMatcher: ( element: Element ) => boolean
): GetCallback<MapperViewToModelPositionEvent> {
	return ( evt, data ) => {
		const { mapper, viewPosition } = data;

		const viewParent = mapper.findMappedViewAncestor( viewPosition );

		if ( !viewElementMatcher( viewParent ) ) {
			return;
		}

		const modelParent = mapper.toModelElement( viewParent );

		data.modelPosition = model.createPositionAt( modelParent!, viewPosition.isAtStart ? 'before' : 'after' );
	};
}

// Default filler offset function applied to all widget elements.
//
// @returns {null}
function getFillerOffset() {
	return null;
}

// Adds a drag handle to the widget.
//
// @param {module:engine/view/containerelement~ContainerElement}
// @param {module:engine/view/downcastwriter~DowncastWriter} writer
function addSelectionHandle( widgetElement: ContainerElement, writer: DowncastWriter ) {
	const selectionHandle = writer.createUIElement( 'div', { class: 'ck ck-widget__selection-handle' }, function( domDocument ) {
		const domElement = this.toDomElement( domDocument );

		// Use the IconView from the ui library.
		const icon = new IconView();
		icon.set( 'content', dragHandleIcon );

		// Render the icon view right away to append its #element to the selectionHandle DOM element.
		icon.render();

		domElement.appendChild( icon.element! );

		return domElement;
	} );

	// Append the selection handle into the widget wrapper.
	writer.insert( writer.createPositionAt( widgetElement, 0 ), selectionHandle );
	writer.addClass( [ 'ck-widget_with-selection-handle' ], widgetElement );
}
