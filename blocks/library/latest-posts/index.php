<?php
/**
 * Server-side rendering of the `core/latest-posts` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/latest-posts` block on server.
 *
 * @param $attributes
 *
 * @return string
 */
function gutenberg_block_core_latest_posts( $attributes ) {
	$posts_to_show = 5;

	if ( array_key_exists( 'poststoshow', $attributes ) ) {
		$posts_to_show = $attributes['poststoshow'];
	}

	$recent_posts = wp_get_recent_posts( array(
		'numberposts' => $posts_to_show,
		'post_status' => 'publish',
	) );

	$posts_content = '';

	foreach ( $recent_posts as $post ) {
		$post_id = $post['ID'];
		$post_permalink = get_permalink( $post_id );
		$post_title = get_the_title( $post_id );

		$posts_content .= "<li><a href='{$post_permalink}'>{$post_title}</a></li>\n";
	}

	$block_content = <<<CONTENT
<div class="blocks-latest-posts">
	<ul>
		{$posts_content}
	</ul>
</div>

CONTENT;

	return $block_content;
}

register_block( 'core/latestposts', array(
	'render' => 'gutenberg_block_core_latest_posts',
) );
