/**
*
*	CHART: Timeseries Heatmap
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
*		- 2014/03/09: Created. [AReines].
*
*
*	DEPENDENCIES:
*		[1] 
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

var Heatmap;

(function( d3, validate ) {
	'use strict';

	// VARIABLES //

	var heatmap;


	// HEATMAP //

	heatmap = function() {

		// PRIVATE: VARIABLES //

		var // CANVAS:
			padding = {
				'top': 80,
				'right': 20,
				'bottom': 50,
				'left': 90
			},

			width = 600,
			height = width / 1.61803398875, // Golden Ratio

			// LABELS:
			title = '',

			xLabel = 'x',
			yLabel = 'y',

			// SCALES:
			xScale = d3.time.scale(),
			yScale = d3.scale.linear(),

			zScale = d3.scale.linear(),

			xMin, xMax, yMin, yMax, zMin, zMax,

			// AXES:
			xTickFormat = d3.time.format( '%M' ),

			xNumTicks,
			yNumTicks,

			xAxisOrient = 'bottom',
			yAxisOrient = 'left',

			_xAxis = d3.svg.axis().scale( xScale ).orient( xAxisOrient ).tickFormat( xTickFormat ).ticks( xNumTicks ),
			_yAxis = d3.svg.axis().scale( yScale ).orient( yAxisOrient ).ticks( yNumTicks ),

			// ACCESSORS:
			xValue = function( d ) { return d[ 0 ]; },
			yValue = function( d ) { return d[ 1 ]; },

			// DATA:
			xEdges = [],
			yEdges = [],

			// ELEMENTS:
			_canvas, _clipPath, _background, _axes, _graph, _heatmap, _meta, _title, _marks, _bins;

			// PUBLIC: OBJECT //

		// FUNCTION: chart( selection )
		//
		// For each element in the selection, bind data and generate the chart...
		function chart( selection ) {

			selection.each( function ( data ) {

				// Standardize the data:
				data = formatData( data );

				// Get the data domains:
				getDomains( data );

				// Create the chart base:
				createBase( this );

				// Create the chart background:
				createBackground();

				// Create the heatmap:
				createHeatmap( data );

				// Create the axes:
				createAxes();

				// Create the title:
				createTitle();

			});

		} // end FUNCTION chart()


		// PRIVATE: METHODS //

		function formatData( data ) {

			var xNumEdges = 100, yNumEdges = 100, min, max;

			// Convert data to standard representation; needed for non-deterministic accessors:
			data = d3.range( data.length ).map( function ( id ) {
				return data[ id ].map( function ( d, i ) {
					return [
						xValue.call( data[ id ], d, i ),
						yValue.call( data[ id ], d, i )
					];
				});
			});

			if ( !xEdges.length ) {
				
				min = d3.min( data, function ( dataset ) {
					return d3.min( dataset, function ( d ) {
						return d[ 0 ];
					});
				});

				max = d3.max( data, function ( dataset ) {
					return d3.max( dataset, function ( d ) {
						return d[ 0 ];
					});
				});

				binWidth = ( max - min ) / ( xNumEdges - 1 );

				xEdges[ 0 ] = min;
				for ( var j = 1; j < xNumEdges - 1; j++ ) {
					xEdges[ j ] = min + ( binWidth*j );
				} // end FOR i

				xEdges[ xNumEdges - 1 ] = max + 1e-16; // inclusive edge

			} // end IF (xEdges)

			if ( !yEdges.length ) {
				
				min = d3.min( data, function ( dataset ) {
					return d3.min( dataset, function ( d ) {
						return d[ 1 ];
					});
				});

				max = d3.max( data, function ( dataset ) {
					return d3.max( dataset, function ( d ) {
						return d[ 1 ];
					});
				});

				binWidth = ( max - min ) / ( yNumEdges - 1 );

				yEdges[ 0 ] = min;
				for ( var k = 1; k < yNumEdges - 1; k++ ) {
					yEdges[ k ] = min + ( binWidth*k );
				} // end FOR i

				yEdges[ yNumEdges - 1 ] = max + 1e-16; // inclusive edge

			} // end IF (yEdges)

			// Histogram the data:
			data = histc( data, xEdges, yEdges );

			// Drop off the first and last bins as these include values which exceeded the lower and upper bounds:
			data = data.map( function ( d, i ) {
				return data[ i ].slice( 1, data[ i ].length - 1 );
			});

			data.slice( 1, data.length-1 );

			return data;

			// FUNCTIONS:

			function histc( data, xEdges, yEdges ) {

				var id1, id2, counts = [];

				// Initialize our counts array: (all zeros):
				for ( var i = -1; i < xEdges.length; i++ ) {
					counts[ i ] = [];
					for ( var j = -1; j < yEdges.length; j++ ) {
						counts[ i ][ j ] = 0;
					} // end FOR i
				} // end FOR j

				// For each value in the data array, find where the value resides along the cumulative in each dimension:
				for ( var k = 0; k < data.length; k++ ) {

					for ( var n = 0; n < data[ k ].length; n++ ) {

						// Perform a binary search along each dimension to find the index where the value equals or exceeds the corresponding value in the cumulative:
						id1 = binarysearch( xEdges, data[ k ][ n ][ 0 ] );
						id2 = binarysearch( yEdges, data[ k ][ n ][ 1 ] );

						// Update the counts for the bin:
						counts[ id1+1 ][ id2+1 ] += 1;

					} // end FOR n

				} // end FOR k

				// Return the counts:
				return counts;

			} // end FUNCTION histc()

			function binarysearch( vector, value ) {
				//
				//	NOTES:
				//		- This is a variation of the binary search algorithm, in which we are not seeking equality, per se, but to find that index at which the supplied value equals or exceeds the value at that index but is less than the value at the next index. We are looking for the right 'bin'.
				//

				var lower = 0,
					upper = vector.length,
					id;

				// Initial checks:
				if ( value < vector[ lower ] ) {
					// Value is below the lower bound:
					return -1;
				} // end IF
				if ( value > vector[ upper-1 ] ) {
					//  Value exceeds the upper bound:
					return upper-1;
				} // end IF

				// We know that the value resides somewhere within our vector...okay to proceed:

				// console.log(lower, id, upper);
				while ( lower <= upper ) {

					// Use a bitwise operator to return: Math.floor( (lower + upper) / 2), which is the middle value:
					id = (lower + upper) >> 1;

					// If the value is greater than the mid point, increase our lower bound index:
					if (value > vector[ id ]) {
						lower = id + 1;
					} else {
					// Does the value equal the upper bound? If yes, exit the loop; else decrement our lower bound index and tighten the bounds:
						upper = ( value === vector[ id ] ) ? -2 : id - 1;
					}

					// console.log(lower, id, upper);

				}

				// Recall the following: 1) if a perfect match has been found, then upper is -2 and the current id is the upper bound at which the match occurred. In this case, we want to return that id. 2) if a perfect match has not been found, we have two scenarios: i) if the value is less than the value at the upper bound index, we want the previous id. ii) if the value is greater than or equal to the value at the upper bound index, we found our id.
				return ( value < vector[id] ) ? id-1 : id;

			} // end FUNCTION binary_search()

		} // end FUNCTION formatData()

		function getDomains( data ) {

			var xDomain, yDomain, zDomain, _xMin, _xMax, _yMin, _yMax, _zMin, _zMax;

			if ( !xMin && xMin !== 0 ) {
				_xMin = xEdges[ 0 ];
			} else {
				_xMin = xMin;
			}
			if ( !xMax && xMax !== 0 ) {
				_xMax = xEdges[ xEdges.length - 1 ];
			} else {
				_xMax = xMax;
			}
			
			xDomain = [ _xMin, _xMax ];

			if ( !yMin && yMin !== 0 ) {
				_yMin = yEdges[ 0 ];
			} else {
				_yMin = yMin;
			}

			if ( !yMax && yMax !== 0 ) {
				_yMax = yEdges[ yEdges.length - 1 ];
			} else {
				_yMax = yMax;
			}
			
			yDomain = [ _yMin, _yMax ];

			if ( !zMin && zMin !== 0 ) {
				_zMin = d3.min( data, function ( dataset ) {
					return d3.min( dataset, function ( d ) {
						return d;
					});
				});
			} else {
				_zMin = zMin;
			}

			if ( !zMax && zMax !== 0 ) {
				_zMax = d3.max( data, function ( dataset ) {
					return d3.max( dataset, function ( d ) {
						return d;
					});
				});
			} else {
				_zMax = zMax;
			}

			zDomain = [ _zMin, _zMax ];


			// Update the x-scale:
			xScale.domain( xDomain )
				.range( [0, width - padding.left - padding.right ] );

			// Update the y-scale:
			yScale.domain( yDomain )
				.range( [height - padding.top - padding.bottom, 0] );

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
				.attr( 'width', width-padding.left-padding.right )
				.attr( 'height', height-padding.top-padding.bottom );

			// Create the axes element:
			_axes = _canvas.append( 'svg:g' )
				.attr( 'property', 'axes' )
				.attr( 'class', 'axes' )
				.attr( 'data-graph-type', 'timeseries-heatmap' )
				.attr( 'transform', 'translate(' + padding.left + ',' + padding.top + ')' );

			// Create the graph element:
			_graph = d3.select( selection ).append( 'div' )
				.attr( 'property', 'graph' )
				.attr( 'class', 'graph' )
				.attr( 'data-graph-type', 'timeseries-heatmap' );

			// Create the meta element:
			_meta = _canvas.append( 'svg:g' )
				.attr( 'property', 'meta' )
				.attr( 'class', 'meta' )
				.attr( 'data-graph-type', 'timeseries-heatmap' )
				.attr( 'transform', 'translate(' + 0 + ',' + 0 + ')' );

		} // end FUNCTION createBase()

		function createBackground() {

			_background = _axes.append( 'svg:rect' )
				.attr( 'class', 'background' )
				.attr( 'x', 0 )
				.attr( 'y', 0 )
				.attr( 'width', width-padding.left-padding.right )
				.attr( 'height', height-padding.top-padding.bottom );

		} // end FUNCTION createBackground()

		function createAxes() {

			_axes.append( 'svg:g' )
				.attr( 'property', 'axis' )
				.attr( 'class', 'x axis' )
				.attr( 'transform', 'translate(0,' + (yScale.range()[0]) + ')' )
				.call( _xAxis );

			_axes.select( '.x.axis' )
				.append( 'svg:text' )
					.attr( 'y', 40 )
					.attr( 'x', (width - padding.left - padding.right) / 2 )
					.attr( 'text-anchor', 'middle' )
					.attr( 'property', 'axis_label' )
					.attr( 'class', 'label' )
					.text( xLabel );

			_axes.select( '.x.axis' )
				.selectAll( '.tick' )
					.attr( 'property', 'axis_tick' );

			_axes.select( '.x.axis' )
				.selectAll( '.domain' )
					.attr( 'property', 'axis_domain' );

			_axes.append( 'svg:g' )
				.attr( 'property', 'axis' )
				.attr( 'class', 'y axis' )
				.call( _yAxis )
					.append( 'svg:text' )
						.attr( 'transform', 'rotate(-90)' )
						.attr( 'y', -72 )
						.attr( 'x', -yScale.range()[0] / 2 )
						.attr( 'text-anchor', 'middle' )
						.attr( 'property', 'axis_label' )
						.attr( 'class', 'label' )
						.text( yLabel );

			_axes.select( '.y.axis' )
				.selectAll( '.tick' )
					.attr( 'property', 'axis_tick' );

			_axes.select( '.y.axis' )
				.selectAll( '.domain' )
					.attr( 'property', 'axis_domain' );

		} // end FUNCTION createAxes()

		function createHeatmap( data ) {

			var context;

			// Create the heatmap element:
			_heatmap = _graph.append( 'canvas' )
				.attr( 'class', 'heatmap' )
				.attr( 'width', width - padding.left - padding.right )
				.attr( 'height', height - padding.top - padding.bottom )
				.style( 'margin-left', padding.left + 'px' )
				.style( 'margin-top', padding.top + 'px' );

			// Get the 2D context within the canvas:
			context = _heatmap[0][0].getContext( '2d' );

			// For fun colors: 'rgb(' + (Math.round( 255*Math.random() ) ) + ','+ (Math.round( 255*Math.random() ) ) + ',255)'
			for ( var i = 0; i < xEdges.length; i++ ) {
				for ( var j = 0; j < yEdges.length; j++ ) {
					drawBin(
						Math.floor( xScale( xEdges[ i ] ) ),
						Math.floor( yScale( yEdges[ j ] ) ),
						Math.ceil( (width-padding.left-padding.right) / ( xEdges.length - 1 ) ),
						Math.ceil( (height-padding.top-padding.bottom) / ( yEdges.length - 1 ) ),
						zScale( data[ i ][ j ] )
					);
				}
			}

			function drawBin( x, y, w, h, fill ) {
				
				context.beginPath();
				context.rect( x, y, w, h );
				context.closePath();
				context.fillStyle = fill;
				context.fill();
			}

		} // end FUNCTION createHeatmap()

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

		// Set/Get: x
		chart.x = function( value ) {
			var rules = 'function';

			if ( !arguments.length ) {
				return xValue;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				xValue = value;
			}
		};

		// Set/Get: y
		chart.y = function( value ) {
			var rules = 'function';

			if ( !arguments.length ) {
				return yValue;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				yValue = value;
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

		// Set/Get: xTickFormat
		chart.xTickFormat = function( value ) {
			// https://github.com/mbostock/d3/wiki/Time-Scales
			var rules = 'string|matches[%Y,%B,%b,%a,%d,%I,%p,%M,%S,%L]';
			if ( !arguments.length ) {
				return xTickFormat;
			}

			validate( value, rules, set );
			
			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				xTickFormat = d3.time.format( value );
				_xAxis.tickFormat( xTickFormat );
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

		// Set/Get: xScale
		chart.xScale = function( value ) {
			var rules = 'function';

			if ( !arguments.length ) {
				return xScale;
			}

			validate( value, rules, set );
			
			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				xScale = value;
				_xAxis.scale( xScale );
			}
		};

		// Set/Get: yScale
		chart.yScale = function( value ) {
			var rules = 'function';

			if ( !arguments.length ) {
				return yScale;
			}

			validate( value, rules, set );
			
			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				yScale = value;
				_yAxis.scale( yScale );
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

		// Set/Get: xEdges
		chart.xEdges = function ( value ) {
			var rules = 'array';

			if ( !arguments.length ) {
				return xEdges;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				xEdges = value;
			}
		};

		// Set/Get: yEdges
		chart.yEdges = function ( value ) {
			var rules = 'array';

			if ( !arguments.length ) {
				return yEdges;
			}
			
			validate( value, rules, set );

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				yEdges = value;
			}
		};

		

		return chart;

	};

	// EXPORTS //

	Heatmap = heatmap;

})( d3, Validator );