/**
 * WordPress dependencies
 */
import { Button, Placeholder, HtmlEmbed, Spinner } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType, query } from '../../api';
import Editable from '../../editable';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

const { attr, children } = query;

registerBlockType( 'core/embed', {
	title: wp.i18n.__( 'Embed' ),

	icon: 'video-alt3',

	category: 'embed',

	attributes: {
		title: attr( 'iframe', 'title' ),
		caption: children( 'figcaption' ),
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align ) {
			return { 'data-align': align };
		}
	},

	edit: class extends wp.element.Component {
		constructor() {
			super( ...arguments );
			this.doServerSideRender = this.doServerSideRender.bind( this );
			this.state = {
				html: '',
				type: '',
				error: false,
				fetching: false,
			};
			this.noPreview = [
				'facebook.com',
			];
			if ( this.props.attributes.url ) {
				// if the url is already there, we're loading a saved block, so we need to render
				this.doServerSideRender();
			}
		}

		componentWillUnmount() {
			// can't abort the fetch promise, so let it know we will unmount
			this.unmounting = true;
		}

		doServerSideRender( event ) {
			if ( event ) {
				event.preventDefault();
			}
			const { url } = this.props.attributes;
			const api_url = wpApiSettings.root + 'oembed/1.0/proxy?url=' + encodeURIComponent( url ) + '&_wpnonce=' + wpApiSettings.nonce;

			this.setState( { error: false, fetching: true } );
			window.fetch( api_url, {
				credentials: 'include',
			} ).then(
				( response ) => {
					if ( this.unmounting ) {
						return;
					}
					response.json().then( ( obj ) => {
						const { html, type } = obj;
						if ( html ) {
							this.setState( { html, type } );
						} else {
							this.setState( { error: true } );
						}
						this.setState( { fetching: false } );
					} );
				}
			);
		}

		render() {
			const { html, type, error, fetching } = this.state;
			const { url, caption, align } = this.props.attributes;
			const { setAttributes, focus, setFocus } = this.props;
			const updateAlignment = ( nextAlign ) => setAttributes( { align: nextAlign } );

			const controls = (
				focus && (
					<BlockControls key="controls">
						<BlockAlignmentToolbar
							value={ align }
							onChange={ updateAlignment }
							controls={ [ 'left', 'center', 'right', 'wide' ] }
						/>
					</BlockControls>
				)
			);

			if ( ! html ) {
				return [
					controls,
					<Placeholder key="placeholder" icon="cloud" label={ wp.i18n.__( 'Embed URL' ) } className="blocks-embed">
						<form onSubmit={ this.doServerSideRender }>
							<input
								type="url"
								className="components-placeholder__input"
								placeholder={ wp.i18n.__( 'Enter URL to embed here...' ) }
								onChange={ ( event ) => setAttributes( { url: event.target.value } ) } />
							{ ! fetching
								? <Button
									isLarge
									type="submit">
									{ wp.i18n.__( 'Embed' ) }
								</Button>
								: <Spinner />
							}
							{ error && <p className="components-placeholder__error">{ wp.i18n.__( 'Sorry, we could not embed that content.' ) }</p> }
						</form>
					</Placeholder>,
				];
			}

			const domain = url.split( '/' )[ 2 ].replace( /^www\./, '' );
			const cannotPreview = this.noPreview.includes( domain );
			let typeClassName = 'blocks-embed';

			if ( 'video' === type ) {
				typeClassName = 'blocks-embed-video';
			}

			return [
				controls,
				<figure key="embed" className={ typeClassName }>
					{ ( cannotPreview ) ? (
						<Placeholder icon="cloud" label={ wp.i18n.__( 'Embed URL' ) }>
							<p className="components-placeholder__error"><a href={ url }>{ url }</a></p>
							<p className="components-placeholder__error">{ wp.i18n.__( 'Previews for this are unavailable in the editor, sorry!' ) }</p>
						</Placeholder>
					) : (
						<HtmlEmbed html={ html } />
					) }
					{ ( caption && caption.length > 0 ) || !! focus ? (
						<Editable
							tagName="figcaption"
							placeholder={ wp.i18n.__( 'Write caption…' ) }
							value={ caption }
							focus={ focus }
							onFocus={ setFocus }
							onChange={ ( value ) => setAttributes( { caption: value } ) }
							inline
							inlineToolbar
						/>
					) : null }
				</figure>,
			];
		}
	},

	save( { attributes } ) {
		const { url, caption } = attributes;
		if ( ! caption || ! caption.length ) {
			return url;
		}

		return (
			<figure>
				{ url }
				<figcaption>{ caption }</figcaption>
			</figure>
		);
	},
} );
