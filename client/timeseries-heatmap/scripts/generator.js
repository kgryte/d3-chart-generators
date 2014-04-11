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

(function ( d3, histc, hist2c, validate ) {
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
			_canvas, _clipPath, _background, _axes, _graph, _heatmap, _buffer, _meta, _title, _marks, _bins;

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
			data = hist2c( data, xEdges, yEdges );

			// Drop off the first and last bins as these include values which exceeded the lower and upper bounds:
			data = data.map( function ( d, i ) {
				return data[ i ].slice( 1, data[ i ].length - 1 );
			});

			return data.slice( 1, data.length-1 );

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
				_zMin = 0;
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
				.range( [ '#ffffff', '#000000' ] );

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

			var context, binWidth, binHeight;

			// Create a canvas buffer:
			_buffer = _graph.append( 'xhtml:canvas' )
				.attr( 'class', 'buffer' )
				.attr( 'width', width - padding.left - padding.right )
				.attr( 'height', height - padding.top - padding.bottom )
				.style( 'margin-left', padding.left + 'px' )
				.style( 'margin-top', padding.top + 'px' )
				.style( 'display', 'none' )
				.style( 'visibility', 'hidden' );

			// Create the heatmap element:
			_heatmap = _graph.append( 'xhtml:canvas' )
				.attr( 'class', 'heatmap' )
				.attr( 'width', width - padding.left - padding.right )
				.attr( 'height', height - padding.top - padding.bottom )
				.style( 'margin-left', padding.left + 'px' )
				.style( 'margin-top', padding.top + 'px' );

			// Get the 2D context within the canvas:
			context = _heatmap[0][0].getContext( '2d' );

			// Calculate the binWidth and binHeight:
			binWidth = Math.ceil( (width-padding.left-padding.right) / ( xEdges.length - 1 ) );
			binHeight = Math.ceil( (height-padding.top-padding.bottom) / ( yEdges.length - 1 ) );

			// For fun colors: 'rgb(' + (Math.round( 255*Math.random() ) ) + ','+ (Math.round( 255*Math.random() ) ) + ',255)'
			for ( var i = 0; i < xEdges.length-1; i++ ) {
				for ( var j = 0; j < yEdges.length-1; j++ ) {
					drawBin(
						context,
						Math.floor( xScale( xEdges[ i ] ) ),
						Math.floor( yScale( yEdges[ j ] ) ),
						binWidth,
						binHeight,
						zScale( data[ i ][ j ] )
					);
				} // end FOR j
			} // end FOR i

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

		function drawBin( context, x, y, w, h, fill ) {

			context.beginPath();
			context.rect( x, y, w, h );
			context.closePath();
			context.fillStyle = fill;
			context.fill();

		} // end FUNCTION drawbin()


		// PUBLIC: METHODS //

		/**
		* FUNCTION: update( data, dx )
		*	Chart update
		*
		* @param {array} data - observation vector. 
		* @param {function} dx - quantity instructing the extent to which data should shift.
		* 
		*/
		chart.update = function( data, dx ) {

			var // Buffer context:
				_context = _buffer[ 0 ][ 0 ].getContext( '2d' ),

				// Heatmap context:
				context = _heatmap[ 0 ][ 0 ].getContext( '2d' ),

				counts, xDomain, xMax, zDomain, zMax, shift, imgData, _imgData, binHeight, colors = [], _yEdges = [],

				_width, _height;


			// Histogram the new data:
			counts = histc( data, yEdges );

			// Drop the first and last bins as these include values which exceed the lower and upper bounds:
			counts = counts.slice( 1, counts.length-1 );

			// Determine if we have reached a new zMax and need to update our zScale:
			zDomain = zScale.domain();

			zMax = d3.max( counts, function ( d ) {
				return d;
			});

			if ( zMax > zDomain[ 1 ] ) {
				zScale.domain( [ zDomain[ 0 ], zMax ] );
			}

			// Determine how many pixels we need to shift the heatmap:
			xDomain = xScale.domain();
			xMax = new Date( xDomain[ 1 ] ).getTime();
			shift = Math.round( xScale( xMax + dx ) - xScale( xMax ) );

			// Set the new xScale domain:
			xScale.domain( [ new Date( xDomain[ 0 ] ).getTime()+dx, xMax+dx ] );

			// Transition the axes:
			_axes.select( '.x.axis' )
				.transition()
					.delay( 0 )
					.duration( 1000 )
					.ease( 'linear' )
					.call( _xAxis );

			// Get the width and height of the heatmap:
			_width = width - padding.left - padding.right;
			_height = height - padding.top - padding.bottom;

			// For each count, get the color and get the pixel value for the yEdge:
			for ( var k = 0; k < yEdges.length; k++ ) {
				colors.push( zScale( counts[ k ] ) );
				_yEdges.push( Math.floor( yScale( yEdges[ k ] ) ) );
			}

			// Calculate the bin height:
			binHeight = Math.ceil( _height / ( yEdges.length - 1 ) );

			// Extract the heatmap image data:
			imgData = context.getImageData( shift, 0, _width-shift, _height );

			// Clear the buffer:
			_context.clearRect( 0, 0, _width, _height );

			// Place the extracted image data on the buffer:
			_context.putImageData( imgData, 0, 0 );

			// Draw the new counts on the buffer...
			for ( var j = 0; j < yEdges.length-1; j++ ) {
				drawBin(
					_context,
					_width-shift,
					_yEdges[ j ],
					shift,
					binHeight,
					colors[ j ]
				);
			} // end FOR j

			// Update the heatmap image data: http://jsperf.com/copying-a-canvas-element
			context.drawImage( _buffer[ 0 ][ 0 ], 0, 0 );

		};


		// SETTERS/GETTERS //

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

})( d3, histc, hist2c, Validator );





