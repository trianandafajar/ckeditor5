/* globals console:false, document, window */

import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';

// Basic styles
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline';
import Strikethrough from '@ckeditor/ckeditor5-basic-styles/src/strikethrough';
import Code from '@ckeditor/ckeditor5-basic-styles/src/code';
import Subscript from '@ckeditor/ckeditor5-basic-styles/src/subscript';
import Superscript from '@ckeditor/ckeditor5-basic-styles/src/superscript';

// Features
import Alignment from '@ckeditor/ckeditor5-alignment/src/alignment';
import Font from '@ckeditor/ckeditor5-font/src/font';
import Highlight from '@ckeditor/ckeditor5-highlight/src/highlight';
import Indent from '@ckeditor/ckeditor5-indent/src/indent';
import Mention from '@ckeditor/ckeditor5-mention/src/mention';
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import RemoveFormat from '@ckeditor/ckeditor5-remove-format/src/removeformat';

// Image & media
import ImageUpload from '@ckeditor/ckeditor5-image/src/imageupload';
import EasyImage from '@ckeditor/ckeditor5-easy-image/src/easyimage';
import CloudServices from '@ckeditor/ckeditor5-cloud-services/src/cloudservices';
import MediaEmbed from '@ckeditor/ckeditor5-media-embed/src/mediaembed';

// Tables
import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';

// Others
import Link from '@ckeditor/ckeditor5-link/src/link';
import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import List from '@ckeditor/ckeditor5-list/src/list';
import Undo from '@ckeditor/ckeditor5-undo/src/undo';
import Redo from '@ckeditor/ckeditor5-undo/src/redo';

ClassicEditor
	.create(document.querySelector('#editor'), {
		cloudServices: {
			tokenUrl: 'https://your-site.com/cs-token-endpoint',
			uploadUrl: 'https://your-region.cke-cs.com/easyimage/upload/'
		},
		plugins: [
			Heading, Font, Highlight, Alignment,
			Bold, Italic, Underline, Strikethrough, Code, Subscript, Superscript, RemoveFormat,
			Link, BlockQuote,
			ImageUpload, EasyImage, CloudServices, MediaEmbed,
			Table, TableToolbar, List, Indent, Undo, Redo,
			Mention, PasteFromOffice
		],
		toolbar: [
			'heading', 'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor', 'highlight', 'alignment', '|',
			'bold', 'italic', 'underline', 'strikethrough', 'code', 'subscript', 'superscript', 'removeFormat', '|',
			'link', 'blockQuote', 'uploadImage', 'mediaEmbed', 'insertTable', '|',
			'bulletedList', 'numberedList', 'outdent', 'indent', '|', 'undo', 'redo'
		],
		image: {
			toolbar: ['imageStyle:inline', 'imageStyle:block', 'imageStyle:side', '|', 'imageTextAlternative']
		},
		mediaEmbed: {
			previewsInData: true
		},
		mention: {
			feeds: [{
				marker: '@',
				feed: ['@Barney', '@Lily', '@Marshall', '@Robin', '@Ted']
			}]
		},
		table: {
			contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
		}
	})
	.then(editor => {
		window.editor = editor;
	})
	.catch(err => {
		console.error(err.stack);
	});
