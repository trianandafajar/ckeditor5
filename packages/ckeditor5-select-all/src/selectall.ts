/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module select-all/selectall
 */

import Plugin, { type PluginDependencies } from '@ckeditor/ckeditor5-core/src/plugin';
import SelectAllEditing from './selectallediting';
import SelectAllUI from './selectallui';

/**
 * The select all feature.
 *
 * This is a "glue" plugin which loads the {@link module:select-all/selectallediting~SelectAllEditing select all editing feature}
 * and the {@link module:select-all/selectallui~SelectAllUI select all UI feature}.
 *
 * Please refer to the documentation of individual features to learn more.
 *
 * @extends module:core/plugin~Plugin
 */
export default class SelectAll extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get requires(): PluginDependencies {
		return [ SelectAllEditing, SelectAllUI ];
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName(): 'SelectAll' {
		return 'SelectAll';
	}
}

declare module '@ckeditor/ckeditor5-core' {
	interface PluginsMap {
		[ SelectAll.pluginName ]: SelectAll;
	}
}
