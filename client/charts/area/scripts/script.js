



(function ( d3 ) {
	'use strict';

	var area,

		simFLG = false,

		width, height,

		labels;


	// Get the chart dimensions:
	width = parseInt( d3.select( '.chart' ).style( 'width' ), 10 );
	height = parseInt( d3.select( '.chart' ).style( 'height' ), 10 );

	// Instantiate a new area chart constructor:
	area = new Area();

	// Configure the area chart:
	area
		.width( width )
		.height( height )
		.xLabel( 'value' )
		.yLabel( 'count' )
		.xMin( 0 )
		.xMax( 1 )
		.yMin( 0 )
		.x( function ( d ) { return d[ 0 ]; })
		.y( function ( d ) { return d[ 1 ]; })
		.interpolation( 'basis' )
		.labels( [ 'area 0' ] )
		.title( 'Area Chart' );

	// Bind data to the chart and generate the area chart...
	if ( simFLG ) {

		// Simulate the data:
		d3.select( '.chart' )
			.datum( simulate() )
			.call( area );

	} else {

		// Grab the data from an external file:
		d3.json( 'data/data.json', function ( error, data ) {
			if ( error ) {
				return console.error( error );
			}
			d3.select( '.chart' )
				.datum( data )
				.call( area );
		});

	}


	/**
	* FUNCTION: simulate()
	*	Simulate area chart data.
	*
	* @returns {array} array of arrays, in which each array is a separate dataset.
	*/
	function simulate() {

		var data = [],
			seriesLength = 301,
			increment = 10,
			mean = 0.5,
			start = 0;

		data[0] = [];
		for ( var i = 0; i < seriesLength; i++ ) {
			data[0].push(
				[
					start + i*increment,
					Math.abs( mean + randn()*0.08 )
				]
			);
		} // end FOR i

		return data;

		function randn() {
			return Math.sqrt( -2*Math.log( Math.random() ) ) * Math.cos( 2*Math.PI*Math.random() );
		}
	}

})( d3 );