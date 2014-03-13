



(function( d3 ) {
	'use strict';

	var heatmap,

		simFLG = true,

		width, height,

		data,

		minEdge, maxEdge, binWidth, numEdges, xEdges = [], yEdges = [];


	// Get the chart dimensions:
	width = parseInt( d3.select( '.chart' ).style( 'width' ), 10 );
	height = parseInt( d3.select( '.chart' ).style( 'height' ), 10 );

	if ( simFLG ) {
		// Simulate some data:
		render( simulate() );
	} else {
		// Grab the data from an external file:
		d3.json( 'data/data.json', function ( error, data ) {
			if ( error ) {
				return console.error( error );
			}
			render( data );
		});
	}

	function getTimestamp( _date ) {
		return new Date( _date ).getTime();
	}

	function render( data ) {

		// Generate the histogram edges: (here, we want to center the bins; e.g., bin center = 0.5, corresponds to edges of 0.475 and 0.525)
		minEdge = -0.025;
		maxEdge = 1.025;
		binWidth = 0.01;

		numEdges = Math.round( ( ( maxEdge - minEdge ) / binWidth ) ) + 1;

		yEdges[ 0 ] = minEdge;
		yEdges[ numEdges - 1] = maxEdge;

		for ( var i = 1; i < numEdges - 1; i++ ) {
			yEdges[ i ] = minEdge + binWidth*i;
		}

		numEdges = data[ 0 ].length + 1;
		binWidth = getTimestamp( data[ 0 ][ 1 ][ 0 ] ) - getTimestamp( data[ 0 ][ 0 ][ 0 ] );

		xEdges[ 0 ] = getTimestamp( data[ 0 ][ 0 ][ 0 ] ) - binWidth / 2;
		xEdges[ numEdges - 1 ] = getTimestamp( data[ 0 ][ numEdges - 2 ][ 0 ] ) + binWidth / 2;

		for ( var j = 1; j < numEdges - 1; j++ ) {
			xEdges[ j ] = xEdges[ 0 ] + binWidth*j;
		}

		// Instantiate a new heatmap constructor:
		heatmap = new Heatmap();

		// Configure the heatmap:
		heatmap
			.width( width )
			.height( height )
			.yMin( 0 )
			.yMax( 1 )
			.xLabel( 'time' )
			.yLabel( 'percent' )
			.x( function ( d ) { return new Date( d[ 0 ] ).getTime(); })
			.y( function ( d ) { return d[ 1 ]; })
			.xEdges( xEdges )
			.yEdges( yEdges )
			.title( 'Chart' );

		// Simulate the data:
		d3.select( '.chart' )
			.datum( data )
			.call( heatmap )
			.each( refresh );

	} // end FUNCTION render()


	/**
	* FUNCTION: refresh()
	*
	*/
	function refresh() {
		var numSeries = 300,
			means = [0.3, 0.5, 0.7],
			increment = 2000,
			data = [];


		setInterval( update, increment );

		function update() {
			data = [];
			for ( var j = 0; j < numSeries; j++ ) {
				data.push( Math.abs( means[ j % means.length ] + randn() * 0.075 ) );
			} // end FOR j

			heatmap.update( data, increment );

		}

		function randn() {
			return Math.sqrt( -2*Math.log( Math.random() ) ) * Math.cos( 2*Math.PI*Math.random() );
		}
	}


	// FUNCTION: simulate()
	//
	// Simulate time series data.
	function simulate() {

		var data = [],
			numSeries = 300,
			seriesLength = 300,
			increment = 2000, // milliseconds
			means = [0.3, 0.5, 0.7],
			now = Date.now();

		for ( var j = 0; j < numSeries; j++ ) {
			data[ j ] = [];
			for ( var i = seriesLength - 1; i >= 0; i-- ) {
				data[ j ].push(
					[
						new Date( now - i*increment ),
						Math.abs( means[ j % means.length ] + randn()*0.075 )
					]
				);
			} // end FOR i
		} // end FOR j

		return data;

		function randn() {
			return Math.sqrt( -2*Math.log( Math.random() ) ) * Math.cos( 2*Math.PI*Math.random() );
		}
	}

})( d3 );