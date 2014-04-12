



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
		.xLabel( 'time [sec]' )
		.yLabel( 'intensity [au]' )
		.yMin( 0 )
		.x( function ( d ) { return d[ 0 ]; })
		.y( function ( d ) { return d[ 1 ]; })
		.interpolation( 'basis' )
		.labels( [ 'area 1', 'area 2', 'area 3' ] )
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
				.datum( formatData( data ) )
				.call( area );
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
			increment = 10,
			mean = 0.5,
			start = 0;

		data[0] = [];
		for ( var i = 0; i < seriesLenght; i++ ) {
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