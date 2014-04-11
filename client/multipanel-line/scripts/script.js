



(function ( d3 ) {
	'use strict';

	var chart,

		simFLG = true,

		width, height,

		labels;


	// Get the chart dimensions:
	width = parseInt( d3.select( '.chart' ).style( 'width' ), 10 );
	height = parseInt( d3.select( '.chart' ).style( 'height' ), 10 );

	// Instantiate a new multipanel line chart constructor:
	chart = new Multipanel.line();

	// Configure the multipanel line chart:
	chart
		.width( width )
		.xLabel( 'time [sec]' )
		.yLabel( 'value' )
		.yMin( 0 )
		.yMax( 1 )
		.yNumTicks( 5 )
		.x( function ( d ) { return d[ 0 ]; })
		.y( function ( d ) { return d[ 1 ]; })
		.labels( [ 'line 1', 'line 2', 'line 3' ] )
		.title( 'Multipanel Line Chart' );

	// Bind data to the chart and generate the multipanel line chart...
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
				.datum( formatData( data ) )
				.call( chart );
		});

	}


	/**
	* FUNCTION: formatData( data )
	*	Takes a key-value data store and formats the data as an array of arrays.
	*
	* @param {array} data - array of objects
	*
	* @returns {array} array of arrays
	*/
	function formatData( data ) {

		var _dat = [];

		for ( var i = 0; i < data[ 0 ].y.length; i++ ) {
			_dat.push( [] );
			for ( var j = 0; j < data.length; j++ ){
				_dat[ i ].push( [ data[ j ].x, data[ j ].y[ i ] ] );
			} // end FOR j
		} // end FOR i

		return _dat;

	} // end FUNCTION formatData()

	/**
	* FUNCTION: simulate()
	*	Simulate line chart data.
	*
	* @returns {array} array of arrays, in which each array is a separate line.
	*/
	function simulate() {

		var data = [],
			seriesLength = 301,
			numSeries = 3,
			increment = 10,
			mean = 0.5,
			start = 0;

		for ( var j = 0; j < numSeries; j++ ) {
			
			data.push( [] );

			for ( var i = 0; i < seriesLength; i++ ) {
				data[ j ].push(
					[
						( start + i*increment ) / 1000,
						Math.abs( mean + randn()*0.08 )
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