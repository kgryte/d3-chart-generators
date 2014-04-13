



(function ( d3 ) {
	'use strict';

	var chart,

		simFLG = false,

		width, height,

		labels,

		minEdge, maxEdge, binWidth, numEdges, edges = [];


	// Get the chart dimensions:
	width = parseInt( d3.select( '.chart' ).style( 'width' ), 10 );
	height = parseInt( d3.select( '.chart' ).style( 'height' ), 10 );

	// Generate the histogram edges: (here, we want to center the bins; e.g., bin center = 0.5, corresponds to edges of 0.475 and 0.525)
	minEdge = -0.025;
	maxEdge = 1.025;
	binWidth = 0.05;

	numEdges = Math.round( ( ( maxEdge - minEdge ) / binWidth ) ) + 1;

	edges[ 0 ] = minEdge;
	edges[ numEdges - 1] = maxEdge;

	for ( var i = 1; i < numEdges - 1; i++ ) {
		edges[ i ] = minEdge + binWidth*i;
	}

	// Instantiate a new small multiples constructor:
	chart = new Chart();

	// Configure the chart:
	chart
		.width( width )
		.xMin( 0 )
		.xMax( 1 )
		.xLabel( 'percent' )
		.yLabel( 'timeseries' )
		.value( function ( d ) { return d[ 1 ]; })
		.edges( edges )
		.sort( 'descending' )
		.labels( d3.range( 0, 100 ).map( function ( id ) {
			return 'timeseries' + id;
		}) )
		.title( 'Small Multiples' );

	// Bind data and generate the chart...
	if ( simFLG ) {

		// Simulate the data:
		d3.select( '.chart' )
			.datum( simulate() )
			.call( chart );

	} else {

		// Grab the data from an external file:
		d3.json( 'data/data.json', function ( error, data ) {
			if ( error ) {
				return console.error( error );
			}
			d3.select( '.chart' )
				.datum( data )
				.call( chart );
		});

	}


	// FUNCTION: simulate()
	//
	// Simulate time series data.
	function simulate() {

		var data = [],
			numSets = 9,
			numSeries = 100,
			seriesLength = 300,
			increment = 2000, // milliseconds
			means = [0.3, 0.5, 0.7],
			now = Date.now();

		for ( var k = 0; k < numSets; k++ ) {
			data[ k ] = [];
			for ( var j = 0; j < numSeries; j++ ) {
				data[ k ][ j ] = [];
				for ( var i = seriesLength - 1; i >= 0; i-- ) {
					data[ k ][ j ].push(
						[
							new Date( now - i*increment ),
							Math.abs( means[ j % means.length ] + randn()*0.08 )
						]
					);
				} // end FOR i
			} // end FOR j
		} // end FOR k

		return data;

		function randn() {
			return Math.sqrt( -2*Math.log( Math.random() ) ) * Math.cos( 2*Math.PI*Math.random() );
		}
	}

})( d3 );