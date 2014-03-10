



(function( d3 ) {
	'use strict';

	var heatmap, width, height;

	width = parseInt( d3.select( '.chart' ).style( 'width' ), 10 );
	height = parseInt( d3.select( '.chart' ).style( 'height' ), 10 );

	heatmap = new Heatmap();

	heatmap
		.width( width )
		.height( height )
		.xMin( 0 )
		.xMax( 10 )
		.yMin( 0 )
		.yMax( 10 )
		.title( 'Chart' );

	d3.select( '.chart' )
		.datum( [ 0 ] )
		.call( heatmap );

})( d3 );