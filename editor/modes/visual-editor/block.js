/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';
import { isString, compact } from 'lodash';

/**
 * Internal dependencies
 */
import Toolbar from 'components/toolbar';
import BlockMover from 'components/block-mover';
import BlockSwitcher from 'components/block-switcher';

function VisualEditorBlock( props ) {
	const { block } = props;
	const settings = wp.blocks.getBlockSettings( block.blockType );

	let BlockEdit;
	if ( settings ) {
		BlockEdit = settings.edit || settings.save;
	}

	if ( ! BlockEdit ) {
		return null;
	}

	const { isHovered } = props;
	const isSelected = props.isSelected;
	const className = classnames( 'editor-visual-editor__block', {
		'is-selected': isSelected,
		'is-hovered': isHovered
	}, block.attributes.position && `align${ block.attributes.position }` );

	const { onChange, onSelect, onDeselect, onMouseEnter, onMouseLeave, onInsertAfter } = props;

	function setAttributes( attributes ) {
		onChange( {
			attributes: {
				...block.attributes,
				...attributes
			}
		} );
	}

	function maybeDeselect( event ) {
		// Annoyingly React does not support focusOut and we're forced to check
		// related target to ensure it's not a child when blur fires.
		if ( ! event.currentTarget.contains( event.relatedTarget ) ) {
			onDeselect();
		}
	}

	const controls = settings.controls && compact(
		settings.controls.map( ( control ) => {
			return isString( control ) ? wp.blocks.controls[ control ] : control;
		} )
	);

	// Disable reason: Each block can receive focus but must be able to contain
	// block children. Tab keyboard navigation enabled by tabIndex assignment.

	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div
			tabIndex="0"
			onFocus={ onSelect }
			onBlur={ maybeDeselect }
			onKeyDown={ onDeselect }
			onMouseEnter={ onMouseEnter }
			onMouseLeave={ onMouseLeave }
			className={ className }
		>
			{ ( isSelected || isHovered ) && <BlockMover uid={ block.uid } /> }
			<div className="editor-visual-editor__block-controls">
				{ isSelected && <BlockSwitcher uid={ block.uid } /> }
				{ isSelected && controls ? (
					<Toolbar
						controls={ controls.map( ( control ) => ( {
							...control,
							onClick: () => control.onClick( block.attributes, setAttributes ),
							isActive: () => control.isActive( block.attributes )
						} ) ) } />
				) : null }
			</div>
			<BlockEdit
				isSelected={ isSelected }
				attributes={ block.attributes }
				setAttributes={ setAttributes }
				insertBlockAfter={ onInsertAfter }
			/>
		</div>
	);
	/* eslint-enable jsx-a11y/no-static-element-interactions */
}

export default connect(
	( state, ownProps ) => ( {
		block: state.blocks.byUid[ ownProps.uid ],
		isSelected: state.selectedBlock === ownProps.uid,
		isHovered: state.hoveredBlock === ownProps.uid
	} ),
	( dispatch, ownProps ) => ( {
		onChange( updates ) {
			dispatch( {
				type: 'UPDATE_BLOCK',
				uid: ownProps.uid,
				updates
			} );
		},
		onSelect() {
			dispatch( {
				type: 'TOGGLE_BLOCK_SELECTED',
				selected: true,
				uid: ownProps.uid
			} );
		},
		onDeselect() {
			dispatch( {
				type: 'TOGGLE_BLOCK_SELECTED',
				selected: false,
				uid: ownProps.uid
			} );
		},
		onMouseEnter() {
			dispatch( {
				type: 'TOGGLE_BLOCK_HOVERED',
				hovered: true,
				uid: ownProps.uid
			} );
		},
		onMouseLeave() {
			dispatch( {
				type: 'TOGGLE_BLOCK_HOVERED',
				hovered: false,
				uid: ownProps.uid
			} );
		},
		onInsertAfter( block ) {
			dispatch( {
				type: 'INSERT_BLOCK',
				after: ownProps.uid,
				block
			} );
		}
	} )
)( VisualEditorBlock );
