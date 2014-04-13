/**
*
*	CHART: multipanel-line
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
*		- 2014/04/07: Created. [AReines].
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
*		Athan Reines. athan@nodeprime.com. 2014.
*
*
*/

var Multipanel = {
		"line": null
	};

(function ( d3, validate ) {
	'use strict';

	// VARIABLES //

	var Chart;


	// MULTIPANEL-LINE //

	Chart = function() {

		// PRIVATE: VARIABLES //

		var // CANVAS:
			padding = {
				'top': 80,
				'right': 20,
				'bottom': 80,
				'left': 90
			},

			width = 600,
			height = null,

			// LABELS:
			labels = [],

			title = '',

			xLabel = 'x',
			yLabel = 'y',

			// SCALES:
			xScale = d3.scale.linear(),
			yScale = d3.scale.linear(),

			xMin, xMax, yMin, yMax,

			// AXES:
			xNumTicks,
			yNumTicks,

			xAxisOrient = 'bottom',
			yAxisOrient = 'left',

			_xAxis = d3.svg.axis()
				.scale( xScale )
				.orient( xAxisOrient )
				.ticks( xNumTicks )
				.tickSize( 12, 0 ),
			_yAxis = d3.svg.axis()
				.scale( yScale )
				.orient( yAxisOrient )
				.ticks( yNumTicks ),

			// PATHS:
			interpolation = 'linear',

			_line = d3.svg.line()
				.x( X )
				.y( Y )
				.interpolate( interpolation ),

			// ACCESSORS:
			xValue = function( d ) { return d[ 0 ]; },
			yValue = function( d ) { return d[ 1 ]; },

			// ELEMENTS:
			_canvas, _clipPath, _graph, _meta, _title, _background, _marks, _paths;


		// PUBLIC: OBJECT //

		// FUNCTION: chart( selection )
		//
		// For each element in the selection, bind data and generate the chart...
		function chart( selection ) {

			selection.each( function ( data ) {

				var numGraphs = data.length,
					graphHeight,
					top = padding.top,
					xticks = true,
					yticks = true;

				// Standardize the data:
				data = formatData( data );

				// Determine the graph height:
				if ( !height ) {
					// Use Golden Ratio:
					height = ( width-padding.left-padding.right) / 1.61803398875 * numGraphs;
				}

				graphHeight = ( height-padding.top-padding.bottom ) / numGraphs;

				// Get the data domains:
				getDomains( data, graphHeight );

				// Create the chart base:
				createBase( this, graphHeight );

				// For each dataset, create a separate graph on the chart canvas...
				for ( var i = 0; i < data.length; i++ ) {

					// Do we include x-axis ticks labels?
					xticks = ( i === data.length-1 ) ? true : false;

					// Do we include the top y-axis tick label?
					yticks = ( i > 0 ) ? true : false;

					// Create the graph element:
					createGraph( top + i*graphHeight );

					// Create the chart background:
					createBackground( graphHeight );

					// Create the paths:
					createPaths( [ data[ i ] ] );

					// Create the x-axis:
					createXAxis( xticks );

					// Create the y-axis:
					createYAxis( yticks );

					// Only create a title for the top panel:
					if ( i === 0 ) {
						createTitle();
					}

				} // end FOR i

			});

		} // end FUNCTION chart()


		// PRIVATE: METHODS //

		function formatData( data ) {

			// Convert data to standard representation; needed for non-deterministic accessors:
			data = d3.range( data.length ).map( function ( id ) {
				return data[ id ].map( function ( d, i ) {
					return [
						xValue.call( data[ id ], d, i ),
						yValue.call( data[ id ], d, i )
					];
				});
			});

			return data;

		} // end FUNCTION formatData()

		function getDomains( data, graphHeight ) {

			var xDomain, yDomain, _xMin, _xMax, _yMin, _yMax;

			if ( !xMin && xMin !== 0 ) {
				_xMin = d3.min( data, function ( dataset ) {
					return d3.min( dataset, function ( d ) {
						return d[ 0 ];
					});
				});
			} else {
				_xMin = xMin;
			}
			if ( !xMax && xMax !== 0 ) {
				_xMax = d3.max( data, function ( dataset ) {
					return d3.max( dataset, function ( d ) {
						return d[ 0 ];
					});
				});
			} else {
				_xMax = xMax;
			}
			
			xDomain = [ _xMin, _xMax ];
			

			if ( !yMin && yMin !== 0 ) {
				_yMin = d3.min( data, function ( dataset ) {
					return d3.min( dataset, function ( d ) {
						return d[ 1 ];
					});
				});
			} else {
				_yMin = yMin;
			}

			if ( !yMax && yMax !== 0 ) {
				_yMax = d3.max( data, function ( dataset ) {
					return d3.max( dataset, function ( d ) {
						return d[ 1 ];
					});
				});
			} else {
				_yMax = yMax;
			}
			
			yDomain = [ _yMin, _yMax ];
			

			// Update the x-scale:
			xScale.domain( xDomain )
				.range( [ 0, width - padding.left - padding.right ] );

			// Update the y-scale:
			yScale.domain( yDomain )
				.range( [ graphHeight, 0 ] );

		} // end FUNCTION getDomains()

		function createBase( selection, clipHeight ) {

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
				.attr( 'width', width - padding.left - padding.right )
				.attr( 'height', clipHeight );

			// Create the meta element:
			_meta = _canvas.append( 'svg:g' )
				.attr( 'property', 'meta' )
				.attr( 'class', 'meta' )
				.attr( 'data-graph-type', 'multipanel-line' )
				.attr( 'transform', 'translate(' + 0 + ',' + 0 + ')' );

		} // end FUNCTION createBase()

		function createGraph( top ) {

			// Create the graph element:
			_graph = _canvas.append( 'svg:g' )
				.attr( 'property', 'graph' )
				.attr( 'class', 'graph' )
				.attr( 'data-graph-type', 'multipanel-line' )
				.attr( 'transform', 'translate(' + padding.left + ',' + top + ')' );


		} // end FUNCTION createGraph()

		function createBackground( graphHeight ) {

			_background = _graph.append( 'svg:rect' )
				.attr( 'class', 'background' )
				.attr( 'x', 0 )
				.attr( 'y', 0 )
				.attr( 'width', width-padding.left-padding.right )
				.attr( 'height', graphHeight );

		} // end FUNCTION createBackground()

		function createPaths( data ) {

			// Create the marks group:
			_marks = _graph.append( 'svg:g' )
				.attr( 'property', 'marks' )
				.attr( 'class', 'marks' )
				.attr( 'clip-path', 'url(#' + _clipPath.attr( 'id' ) + ')' );

			// Add paths:
			_paths = _marks.selectAll( '.line' )
				.data( data )
			  .enter().append( 'svg:path' )
				.attr( 'property', 'line' )
				.attr( 'class', 'line' )
				.attr( 'data-label', function ( d, i ) { return labels[ i ]; })
				.attr( 'd', _line );

		} // end FUNCTION createPaths()

		function createXAxis( flg ) {

			var xAxis;

			if ( !flg ) {
				_xAxis.tickFormat( '' );
			} else {
				_xAxis.tickFormat( null );
			}

			xAxis = _graph.append( 'svg:g' )
				.attr( 'property', 'axis' )
				.attr( 'class', 'x axis' )
				.attr( 'transform', 'translate(0,' + (yScale.range()[0]) + ')' )
				.call( _xAxis );

			if ( flg ) {
				xAxis.append( 'svg:text' )
					.attr( 'y', 50 )
					.attr( 'x', (width - padding.left - padding.right) / 2 )
					.attr( 'text-anchor', 'middle' )
					.attr( 'property', 'axis_label' )
					.attr( 'class', 'label' )
					.text( xLabel );
			}

			xAxis.selectAll( '.tick line' )
				.attr( 'transform', 'translate(0,-6)' );

			xAxis.selectAll( '.tick' )
				.attr( 'property', 'axis_tick' );

			xAxis.selectAll( '.domain' )
				.attr( 'property', 'axis_domain' );

		} // end FUNCTION createXAxis()

		function createYAxis( flg ) {

			var yAxis, yTicks;

			yAxis = _graph.append( 'svg:g' )
				.attr( 'property', 'axis' )
				.attr( 'class', 'y axis' )
				.call( _yAxis );


			yAxis.append( 'svg:text' )
				.attr( 'transform', 'rotate(-90)' )
				.attr( 'y', -72 )
				.attr( 'x', -yScale.range()[0] / 2 )
				.attr( 'text-anchor', 'middle' )
				.attr( 'property', 'axis_label' )
				.attr( 'class', 'label' )
				.text( yLabel );

			yTicks = yAxis.selectAll( '.tick' );

			if ( flg ) {
				yTicks.style( 'visibility', function ( d, i ) {
					if ( i === yTicks[ 0 ].length-1 ) {
						return 'hidden';
					}
				});
			}

			yTicks.attr( 'property', 'axis_tick' );

			yAxis.selectAll( '.domain' )
				.attr( 'property', 'axis_domain' );

		} // end FUNCTION createYAxis()

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
			return xScale( d[ 0 ] );
		}

		// y-accessor:
		function Y( d ) {
			return yScale( d[ 1 ] );
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

		// Set/Get: interpolation
		chart.interpolation = function( value ) {
			// https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-line_interpolate
			var rules = 'string|matches[linear,linear-closed,step,step-before,step-after,basis,basis-open,basis-closed,bundle,cardinal,cardinal-open,cardinal-closed,monotone]';

			if ( !arguments.length ) {
				return interpolation;
			}

			validate( value, rules, set );
			
			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				interpolation = value;
				_line.interpolate( interpolation );
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

		// Set/Get: xMin
		chart.xMin = function( value ) {
			var rules = 'number';

			if ( !arguments.length ) {
				return xMin;
			}

			if ( !_.isUndefined( value ) && !_.isNull( value ) ) {
				validate( value, rules, set );
			}
			
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
			
			if ( !_.isUndefined( value ) && !_.isNull( value ) ) {
				validate( value, rules, set );
			}

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
			
			if ( !_.isUndefined( value ) && !_.isNull( value ) ) {
				validate( value, rules, set );
			}

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
			
			if ( !_.isUndefined( value ) && !_.isNull( value ) ) {
				validate( value, rules, set );
			}

			return chart;

			function set( errors ) {
				if ( errors ) {
					console.error( errors );
					return;
				}
				yMax = value;
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

		return chart;

	};


	// EXPORTS //

	Multipanel.line = Chart;

})( d3, Validator );