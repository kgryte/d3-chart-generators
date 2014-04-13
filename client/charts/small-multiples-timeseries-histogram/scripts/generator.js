/**
*
*	CHART: Small Multiples Timeseries 2D Histogram
*
*
*
*	DESCRIPTION:
*		- 
*
*
*	API:
*		- 
*
*
*	NOTES:
*		[1] 
*
*
*	TODO:
*		[1] 
*
*
*	HISTORY:
*		- 2014/04/12: Created. [AReines].
*
*
*	DEPENDENCIES:
*		[1] d3.js
*		[2] histc.js
*		[3] validate.js
*
*
*	LICENSE:
*		MIT. http://opensource.org/licenses/MIT
*
*	Copyright (c) 2014. Athan Reines.
*
*
*	AUTHOR:
*		Athan Reines. athan@nodeprime.com. 2014
*
*
*/

var Chart;

(function ( d3, histc, validate ) {
	'use strict';

	// VARIABLES //

	var chart;


	// CHART //

	chart = function() {

		// PRIVATE: VARIABLES //

		var // CANVAS:
			padding = {
				'top': 80,
				'right': 20,
				'bottom': 50,
				'left': 90
			},

			width = 1000,
			height = null,

			numCols = 5,

			// GRAPH:
			graphPadding = {
				'top': 5,
				'left': 5,
				'bottom': 5,
				'right': 5
			},
			_graphWidth = null,
			_graphHeight = null,

			// LABELS:
			labels = [],

			title = '',

			xLabel = 'x',
			yLabel = 'y',

			// SCALES:
			_xScale = d3.scale.linear(),
			_yScale = d3.scale.linear(),

			zScale = d3.scale.linear(),

			xMin, xMax, yMin, yMax, zMin, zMax,

			// AXES:
			xNumTicks,
			yNumTicks,

			xAxisOrient = 'bottom',
			yAxisOrient = 'left',

			_xAxis = d3.svg.axis().scale( _xScale ).orient( xAxisOrient ).ticks( xNumTicks ),
			_yAxis = d3.svg.axis().scale( _yScale ).orient( yAxisOrient ).ticks( yNumTicks ),

			// ACCESSORS:
			value = function( d ) { return d; },

			// DATA:
			edges = [],

			sort = 'ascending',

			_binHeight = 0,

			// ELEMENTS:
			_canvas, _clipPath, _graph, _background, _meta, _title, _histogram, _marks, _bins;

			// PUBLIC: OBJECT //

		// FUNCTION: chart( selection )
		//
		// For each element in the selection, bind data and generate the chart...
		function chart( selection ) {

			selection.each( function ( data ) {

				var numGraphs = data.length,
					numRows = Math.ceil( numGraphs / numCols ),
					row = 0,
					left = padding.left,
					top = padding.top,
					xticks = true,
					yticks = true;

				// Standardize the data:
				data = formatData( data );

				// Determine the graph dimensions:
				_graphWidth = ( ( width-padding.left-padding.right ) - (numCols-1) * (graphPadding.left+graphPadding.right) ) / numCols;

				_graphHeight = _graphWidth;

				if ( !height ) {
					height = ( _graphWidth * numRows ) + padding.top+ padding.bottom;
				}

				// Get the data domains:
				getDomains( data );

				// Create the chart base:
				createBase( this );

				// For each dataset, create a separate graph on the chart canvas:
				for ( var i = 0; i < data.length; i++ ) {

					row = Math.floor( i / numCols );

					// Do we include x-axis tick labels?
					xticks = ( row === numRows-1 );

					// Do we include the y-axis tick labels?
					yticks = ( (i % numCols) === 0 );

					// Create the graph element:
					createGraph( left + (i%numCols)*_graphWidth, top + row*_graphHeight );

					// Create the chart background:
					createBackground();

					// Create the histogram:
					createHistogram( data[ i ] );

					// Create the axes:
					// createAxes();

				} // end FOR i

				// Create the title:
				createTitle();

			});

		} // end FUNCTION chart()


		// PRIVATE: METHODS //

		function formatData( data ) {

			var means = [], _temp = [], _sort, min, max, numEdges = 21, binWidth;

			// Convert data to standard representation; needed for non-deterministic accessors:
			data = d3.range( data.length ).map( function ( i ) {
				return d3.range( data[ i ].length ).map( function ( j ) {
					return data[ i ][ j ].map( function ( d, k ) {
						return value.call( data[ i ][ j ], d, k );
					});
				});
			});

			function getMean( data ) {
				return d3.range( data.length ).map( function ( id ) {
					return d3.mean( data[ id ], function ( d ) {
						return d;
					});
				});
			}

			if ( sort ) {

				// Get the mean value for each dataset:
				for ( var m = 0; m < data.length; m++ ) {
					var _dat = getMean( data[ m ] );
					means.push( getMean( data[ m ] ));
				} // end FOR m

				// Create temporary array where we bind a dataset and its mean:
				for ( var i = 0; i < data.length; i++ ) {
					_temp[ i ] = [];
					for ( var j = 0; j < data[ i ].length; j++ ) {
						_temp[ i ].push({
							'data': data[ i ][ j ],
							'mean': means[ i ][ j ]
						});
					} // end FOR j
				} // end FOR i

				switch ( sort ) {

					case 'ascending':
						_sort = function ( a, b ) {
							return a.mean < b.mean ? -1 : ( a.mean > b.mean ? 1 : 0 );
						};
						break;

					case 'descending':
						_sort = function ( a, b ) {
							return a.mean > b.mean ? -1 : ( a.mean < b.mean ? 1 : 0 );
						};
						break;
					default:
						// No sort...
						console.log( 'WARNING:unrecognized sort: ' + sort + '. No sorting applied.' );
						break;
				} // end SWITCH (sort)

				// Sort each dataset based on its mean:
				for ( var s = 0; s < data.length; s++ ) {
					_temp[ s ].sort( _sort );
				}

				// Re-order the data based on the sorted means:
				for ( var r = 0; r < data.length; r++ ) {
					data[ r ] = d3.range( data[ r ].length ).map( function ( id ) {
						return _temp[ r ][ id ].data;
					});
				}

			} // end IF (sort)

			if ( !edges.length ) {
				
				min = d3.min( data[ 0 ], function ( dataset ) {
					return d3.min( dataset, function ( d ) {
						return d;
					});
				});

				max = d3.max( data[ 0 ], function ( dataset ) {
					return d3.max( dataset, function ( d ) {
						return d;
					});
				});

				binWidth = ( max - min ) / ( numEdges - 1 );

				edges[ 0 ] = min;
				for ( var j = 1; j < numEdges - 1; j++ ) {
					edges[ j ] = min + ( binWidth*j );
				} // end FOR i

				edges[ numEdges - 1 ] = max + 1e-16; // inclusive edge

			} // end IF (edges)

			// Histogram the data:
			for ( var h = 0; h < data.length; h++ ) {
				data[ h ] = d3.range( data[ h ].length ).map( function ( id ) {

					var counts;

					counts = histc( data[ h ][ id ], edges );

					// Augment counts to include the edge and binWidth (binWidth is needed in the event of variable bin width ):
					counts = counts.map( function ( d, i ) {
						return [
							edges[ i-1 ], // x
							id, // y
							edges[ i ] - edges[ i-1 ], // width
							1, // height
							counts[ i ] // color
						];
					});

					// Drop off the first and last bins as these include values which exceeded the lower and upper bounds:
					return counts.slice( 1, counts.length-1 );
					
				});
			} // end FOR h

			return data;

		} // end FUNCTION formatData()

		function getDomains( data ) {

			var xDomain, yDomain, zDomain, _xMin, _xMax, _yMin, _yMax, _zMin, _zMax;

			if ( !xMin && xMin !== 0 ) {
				_xMin = d3.min( data, function ( data ) {
					return d3.min( data, function ( dataset ) {
						return d3.min( dataset, function ( d ) {
							return d[ 0 ];
						});
					});
				});
			} else {
				_xMin = xMin;
			}

			if ( !xMax && xMax !== 0 ) {
				_xMax = d3.max( data, function ( data ) {
					return d3.max( data, function ( dataset ) {
						return d3.max( dataset, function ( d ) {
							return d[ 0 ];
						});
					});
				});
			} else {
				_xMax = xMax;
			}
			
			xDomain = [ _xMin, _xMax ];
			

			if ( !yMin && yMin !== 0 ) {
				_yMin = 0;
			} else {
				_yMin = yMin;
			}

			if ( !yMax && yMax !== 0 ) {
				_yMax = d3.max( data, function ( data ) {
					return data.length;
				});
			} else {
				_yMax = yMax;
			}
			
			yDomain = [ _yMin, _yMax ];

			if ( !zMin && zMin !== 0 ) {
				_zMin = d3.min( data, function ( data ) {
					return d3.min( data, function ( dataset ) {
						return d3.min( dataset, function ( d ) {
							return d[ 4 ];
						});
					});
				});
			} else {
				_zMin = zMin;
			}

			if ( !zMax && zMax !== 0 ) {
				_zMax = d3.max( data, function ( data ) {
					return d3.max( data, function ( dataset ) {
						return d3.max( dataset, function ( d ) {
							return d[ 4 ];
						});
					});
				});
			} else {
				_zMax = zMax;
			}

			zDomain = [ _zMin, _zMax ];

			// Update the x-scale:
			_xScale.domain( xDomain )
				.range( [ 0, _graphWidth ] );

			// Update the y-scale:
			_yScale.domain( yDomain )
				.range( [ _graphHeight, 0 ] );

			// Update the z-scale:
			zScale.domain( zDomain )
				.range( ['#ffffff', '#000000'] );

		} // end FUNCTION getDomains()

		function createBase( selection ) {

			// Create the SVG element:
			_canvas = d3.select( selection ).append( 'svg:svg' )
				.attr( 'property', 'canvas' )
				.attr( 'class', 'canvas' )
				.attr( 'width', width )
				.attr( 'height', height )
				.attr( 'viewBox', '0 0 ' + width + ' ' + height )
				.attr( 'preserveAspectRatio', 'xMidYMid' )
				.attr( 'data-aspect', width / height );

			// Create the clip-path:
			_clipPath = _canvas.append( 'svg:defs' )
				.append( 'svg:clipPath' )
					.attr( 'id', Date.now() );

			_clipPath.append( 'svg:rect' )
				.attr( 'class', 'clipPath' )
				.attr( 'width', _graphWidth )
				.attr( 'height', _graphHeight );

			// Create the meta element:
			_meta = _canvas.append( 'svg:g' )
				.attr( 'property', 'meta' )
				.attr( 'class', 'meta' )
				.attr( 'data-graph-type', 'timeseries-histogram' )
				.attr( 'transform', 'translate(' + 0 + ',' + 0 + ')' );

		} // end FUNCTION createBase()

		function createGraph( left, top ) {

			// Create the graph element:
			_graph = _canvas.append( 'svg:g' )
				.attr( 'property', 'graph' )
				.attr( 'class', 'graph' )
				.attr( 'data-graph-type', 'timeseries-histogram' )
				.attr( 'transform', 'translate(' + left + ',' + top + ')' );

		} // end FUNCTION createGraph()

		function createBackground() {

			_background = _graph.append( 'svg:rect' )
				.attr( 'class', 'background' )
				.attr( 'x', 0 )
				.attr( 'y', 0 )
				.attr( 'width', _graphWidth )
				.attr( 'height', _graphHeight );

		} // end FUNCTION createBackground()

		function createAxes() {

			_graph.append( 'svg:g' )
				.attr( 'property', 'axis' )
				.attr( 'class', 'x axis' )
				.attr( 'transform', 'translate(0,' + (_yScale.range()[0]) + ')' )
				.call( _xAxis );

			_graph.select( '.x.axis' )
				.append( 'svg:text' )
					.attr( 'y', 40 )
					.attr( 'x', (width - padding.left - padding.right) / 2 )
					.attr( 'text-anchor', 'middle' )
					.attr( 'property', 'axis_label' )
					.attr( 'class', 'label' )
					.text( xLabel );

			_graph.select( '.x.axis' )
				.selectAll( '.tick' )
					.attr( 'property', 'axis_tick' );

			_graph.select( '.x.axis' )
				.selectAll( '.domain' )
					.attr( 'property', 'axis_domain' );

			_graph.append( 'svg:g' )
				.attr( 'property', 'axis' )
				.attr( 'class', 'y axis' )
				.call( _yAxis )
					.append( 'svg:text' )
						.attr( 'transform', 'rotate(-90)' )
						.attr( 'y', -72 )
						.attr( 'x', -_yScale.range()[0] / 2 )
						.attr( 'text-anchor', 'middle' )
						.attr( 'property', 'axis_label' )
						.attr( 'class', 'label' )
						.text( yLabel );

			_graph.select( '.y.axis' )
				.selectAll( '.tick' )
					.attr( 'property', 'axis_tick' );

			_graph.select( '.y.axis' )
				.selectAll( '.domain' )
					.attr( 'property', 'axis_domain' );

		} // end FUNCTION createAxes()

		function createHistogram( data ) {

			// Calculate the bin height:
			_binHeight = _yScale( 0 ) - _yScale( 1 );

			// Create the histogram element:
			_histogram = _graph.append( 'svg:g' )
				.attr( 'clip-path', 'url(#' + _clipPath.attr( 'id' ) + ')' )
				.attr( 'transform', 'translate( ' + 0 + ', ' + 0 + ')' );

			// Create a marks group:
			_marks = _histogram.selectAll( '.marks' )
				.data( data )
			  .enter().append( 'svg:g' )
				.attr( 'property', 'marks' )
				.attr( 'class', 'marks' )
				.attr( 'data-label', function( d, i ) { return labels[ i ];
				});

			// Add bins:
			_bins = _marks.selectAll( '.bin' )
				.data( function ( d ) { return d; })
			  .enter().append( 'svg:rect' )
				.attr( 'property', 'bin' )
				.attr( 'class', 'bin' )
				.attr( 'x', X )
				.attr( 'y', Y )
				.attr( 'width', Width )
				.attr( 'height', _binHeight )
				.style( 'fill', Color );

			// Add tooltips:
			_bins.append( 'svg:title' )
				.attr( 'class', 'tooltip' )
				.text( function ( d ) {
					return Math.round( d[ 4 ] );
				});

		} // end FUNCTION createHistogram()

		function createTitle() {

			_title = _meta.append( 'svg:foreignObject' )
				.attr( 'width', width )
				.attr( 'height', height - padding.bottom )
				.attr( 'x', 0 )
				.attr( 'y', 0 )
				.append( 'xhtml:span' )
					.attr( 'property', 'chart_title' )
					.attr( 'class', 'title' )
					.html( title );

		} // end FUNCTION createTitle()


		// x-accessor:
		function X( d ) {
			return _xScale( d[ 0 ] );
		}

		// y-accessor:
		function Y( d ) {
			return _yScale( d[ 1 ] ) - _binHeight;
		}

		// width-accessor:
		function Width( d ) {
			return _xScale( d[ 2 ] );
		}

		// color-accessor:
		function Color( d ) {
			return zScale( d[ 4 ] );
		}


		// PUBLIC: METHODS //

		// Set/Get: padding
		chart.padding = function( value ) {
			var rules = 'object|has_properties[left,right,top,bottom]';

			if ( !arguments.length ) {
				return padding;
			}

			validate( value, rules, set );
			
			return chart;

			function set( errors ) {
				var rules = 'number';

				if ( errors ) {
					console.error( errors );
					return;
				}

				for ( var key in value ) {
					if ( value.hasOwnProperty( key ) ) {
						errors = validate( value[ key ], rules );
						if ( errors.length ) {
							console.error( errors );
							return;
						}
					}
				}

				// Set the value:
				padding = value;
			}

		};

		// Set/Get: paddingLeft
		chart.paddingLeft = function( value ) {
			var rules = 'number';

			if ( !arguments.length ) {
				return padding.left;
			}

			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				padding.left = value;
			}
		};

		// Set/Get: paddingRight
		chart.paddingRight = function( value ) {
			var rules = 'number';

			if ( !arguments.length ) {
				return padding.right;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				padding.right = value;
			}
		};

		// Set/Get: paddingTop
		chart.paddingTop = function( value ) {
			var rules = 'number';

			if ( !arguments.length ) {
				return padding.top;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				padding.top = value;
			}
		};

		// Set/Get: paddingBottom
		chart.paddingBottom = function( value ) {
			var rules = 'number';

			if ( !arguments.length ) {
				return padding.bottom;
			}

			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				padding.bottom = value;
			}
		};

		// Set/Get: width
		chart.width = function( value ) {
			var rules = 'number';

			if ( !arguments.length ) {
				return width;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				width = value;
			}
		};

		// Set/Get: height
		chart.height = function( value ) {
			var rules = 'number';

			if ( !arguments.length ) {
				return height;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				height = value;
			}
		};

		// Set/Get: value
		chart.value = function( val ) {
			var rules = 'function';

			if ( !arguments.length ) {
				return value;
			}
			
			validate( val, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				value = val;
			}
		};

		// Set/Get: xLabel
		chart.xLabel = function( value ) {
			var rules = 'string';

			if ( !arguments.length ) {
				return xLabel;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				xLabel = value;
			}
		};

		// Set/Get: yLabel
		chart.yLabel = function( value ) {
			var rules = 'string';

			if ( !arguments.length ) {
				return yLabel;
			}

			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				yLabel = value;
			}
		};

		// Set/Get: xNumTicks
		chart.xNumTicks = function( value ) {
			var rules = 'number';

			if ( !arguments.length ) {
				return xNumTicks;
			}

			if ( _.isUndefined( value ) || _.isNull( value ) ) {
				set();
			} else {
				validate( value, rules, set );
			}

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				xNumTicks = value;
				_xAxis.ticks( xNumTicks );
			}
		};

		// Set/Get: yNumTicks
		chart.yNumTicks = function( value ) {
			var rules = 'number';

			if ( !arguments.length ) {
				return yNumTicks;
			}

			if ( _.isUndefined( value ) || _.isNull( value ) ) {
				set();
			} else {
				validate( value, rules, set );
			}

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				yNumTicks = value;
				_yAxis.ticks( yNumTicks );
			}
		};

		// Set/Get: xMin
		chart.xMin = function( value ) {
			var rules = 'number';

			if ( !arguments.length ) {
				return xMin;
			}

			validate( value, rules, set );
			
			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				xMin = value;
			}
		};

		// Set/Get: xMax
		chart.xMax = function( value ) {
			var rules = 'number';

			if ( !arguments.length ) {
				return xMax;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				xMax = value;
			}
		};

		// Set/Get: yMin
		chart.yMin = function( value ) {
			var rules = 'number';

			if ( !arguments.length ) {
				return yMin;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				yMin = value;
			}
		};

		// Set/Get: yMax
		chart.yMax = function( value ) {
			var rules = 'number';

			if ( !arguments.length ) {
				return yMax;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				yMax = value;
			}
		};

		// Set/Get: zMin
		chart.zMin = function( value ) {
			var rules = 'number';

			if ( !arguments.length ) {
				return zMin;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				zMin = value;
			}
		};

		// Set/Get: zMax
		chart.zMax = function( value ) {
			var rules = 'number';

			if ( !arguments.length ) {
				return zMax;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				zMax = value;
			}
		};

		// Set/Get: zScale
		chart.zScale = function( value ) {
			var rules = 'function';

			if ( !arguments.length ) {
				return zScale;
			}

			validate( value, rules, set );
			
			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				zScale = value;
			}
		};

		// Set/Get: xAxisOrient
		chart.xAxisOrient = function( value ) {
			var rules = 'matches[bottom,top]';

			if ( !arguments.length ) {
				return xAxisOrient;
			}

			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				xAxisOrient = value;
				_xAxis.orient( xAxisOrient );
			}
		};

		// Set/Get: yAxisOrient
		chart.yAxisOrient = function( value ) {
			var rules = 'matches[left,right]';

			if ( !arguments.length ) {
				return yAxisOrient;
			}

			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				yAxisOrient = value;
				_yAxis.orient( yAxisOrient );
			}
		};

		// Set/Get: title
		chart.title = function ( value ) {
			var rules = 'string';

			if ( !arguments.length ) {
				return title;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				title = value;
			}
		};

		// Set/Get: labels
		chart.labels = function ( value ) {
			var rules = 'array';

			if ( !arguments.length ) {
				return labels;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				labels = value;
			}
		};

		// Set/Get: edges
		chart.edges = function ( value ) {
			var rules = 'array';

			if ( !arguments.length ) {
				return edges;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				edges = value;
			}
		};

		// Set/Get: sort
		chart.sort = function( value ) {
			var rules = 'matches[ascending,descending]';

			if ( !arguments.length ) {
				return sort;
			}

			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				sort = value;
			}
		};

		return chart;

	};

	// EXPORTS //

	Chart = chart;

})( d3, histc, Validator );