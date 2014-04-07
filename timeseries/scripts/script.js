



(function ( d3 ) {
	'use strict';

	var timeseries,

		simFLG = false,

		width, height,

		labels;


	// Get the chart dimensions:
	width = parseInt( d3.select( '.chart' ).style( 'width' ), 10 );
	height = parseInt( d3.select( '.chart' ).style( 'height' ), 10 );

	// Instantiate a new timeseries constructor:
	timeseries = new Timeseries();

	// Configure the timeseries:
	timeseries
		.width( width )
		.height( height )
		.xLabel( 'time [sec]' )
		.yLabel( 'intensity' )
		.yMin( 0 )
		.x( function ( d ) { return d.x; })
		.y( function ( d ) { return d.y[0]; })
		.labels( [ 'DexDem', 'DexAem', 'AexAem' ] )
		.title( 'Timeseries' );

	// Bind data to the chart and generate the timeseries...
	if ( simFLG ) {

		// Simulate the data:
		d3.select( '.chart' )
			.datum( simulate() )
			.call( timeseries );

	} else {

		// Grab the data from an external file:
		d3.json( 'data/data.json', function ( error, data ) {
			if ( error ) {
				return console.error( error );
			}
			d3.select( '.chart' )
				.datum( data )
				.call( timeseries );
		});

	}


	// FUNCTION: simulate()
	//
	// Simulate time series data.
	function simulate() {

		var data = [],
			seriesLength = 300,
			increment = 10, // milliseconds
			mean = 0.5,
			now = Date.now();

		data[0] = [];
		for ( var i = seriesLength - 1; i >= 0; i-- ) {
			data[0].push(
				[
					new Date( now - i*increment ),
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