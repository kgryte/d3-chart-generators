



(function ( d3 ) {
	'use strict';

	var histogram,

		simFLG = true,

		width, height,

		edges;


	// Get the chart dimensions:
	width = parseInt( d3.select( '.chart' ).style( 'width' ), 10 );
	height = parseInt( d3.select( '.chart' ).style( 'height' ), 10 );

	// Calculate the histogram bin edges:
	edges = getEdges( -0.025, 1.025, 0.05 );

	// Instantiate a new histogram chart constructor:
	histogram = new Histogram();

	// Configure the histogram chart:
	histogram
		.width( width )
		.height( height )
		.xLabel( 'value' )
		.yLabel( 'counts' )
		.labels( [ 'histogram 1' ] )
		.title( 'Histogram' )
		.xMin( 0 )
		.xMax( 1 )
		.yMin( 0 )
		.yMax( 75 )
		.value( function ( d ) { return d[ 1 ]; })
		.edges( edges );

	// Bind data to the chart and generate the histogram chart...
	if ( simFLG ) {

		// Simulate the data:
		d3.select( '.chart' )
			.datum( simulate() )
			.call( histogram );

	} else {

		// Grab the data from an external file:
		d3.json( 'data/data.json', function ( error, data ) {
			if ( error ) {
				return console.error( error );
			}
			d3.select( '.chart' )
				.datum( formatData( data ) )
				.call( histogram );
		});

	}

	/**
	* FUNCTION: getEdges( min, max, binWidth )
	*	Generate an edge vector to define the histogram bins.
	*
	* @param {number} min - min edge; defines the lower bound
	* @param {number} max - max edges; defines the upper bound
	* @param {number} binWidth - width of the histogram
	*
	* @returns {array} a 1-dimensional array of edges
	*/
	function getEdges( min, max, binWidth ) {
		var numEdges, edges = [];

		numEdges = Math.round( ( ( max - min ) / binWidth ) ) + 1;

		edges[ 0 ] = min;
		edges[ numEdges - 1] = max;

		for ( var i = 1; i < numEdges - 1; i++ ) {
			edges[ i ] = min + binWidth*i;
		}

		return edges;
	} // end FUNCTION getEdges()

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
	*	Simulate histogram chart data.
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