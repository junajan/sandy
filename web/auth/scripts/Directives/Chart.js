Sandy.directive('chart', [
	'$compile', '$timeout',
	function($compile, $timeout) {
		return {
			restrict: 'E',
			replace: true,
			scope: {
				data: '=',
				type: '&',
			},
            template: '<div class="chart" style="height: 250px; width: 99%;"></div>',
			link: function($scope, element, attrs) {
				$scope.$watch('data', function(data) {

					// var c = new Morris.Line({
					// 	element: $(element),
				 //        resize: true,
     //    				redraw: true,
					// 	data: data,
					// 	xkey: 'y',
					// 	ykeys: ['item1', 'item2'],
					// 	labels: ['Item 1', 'Item 2'],
					// 	lineColors: ['#a0d0e0', '#3c8dbc'],
					// 	hideHover: 'auto'
					// });
					

					function gd(year, month, day) {
						return new Date(year, month - 1, day).getTime();
					}


					var pulz1 = [
						[gd(2012, 1, 1), 1], [gd(2012, 1, 2), -2], [gd(2012, 1, 3), -2], [gd(2012, 1, 4), 1],
						[gd(2012, 1, 5), 3], [gd(2012, 1, 6), 4], [gd(2012, 1, 7), 5], [gd(2012, 1, 8), 6],
						[gd(2012, 1, 9), 7], [gd(2012, 1, 10), 7], [gd(2012, 1, 11), 6], [gd(2012, 1, 12), 7],
						[gd(2012, 1, 13), 8], [gd(2012, 1, 14), 8], [gd(2012, 1, 15), 3], [gd(2012, 1, 16), 2],
						[gd(2012, 1, 17), 4], [gd(2012, 1, 18), -1], [gd(2012, 1, 19), 5], [gd(2012, 1, 20), 6],
						[gd(2012, 1, 21), -2], [gd(2012, 1, 22), -7], [gd(2012, 1, 23), -9], [gd(2012, 1, 24), -8],
						[gd(2012, 1, 25), -7], [gd(2012, 1, 26), -6], [gd(2012, 1, 27), -3], [gd(2012, 1, 28), 1], 
						[gd(2012, 1, 29), 6], [gd(2012, 1, 30), 9], [gd(2012, 1, 31), 8]
					];
					//wind
					var pulz2 = [
						[gd(2012, 1, 1), 11], [gd(2012, 1, 2), 9], [gd(2012, 1, 3), 7], [gd(2012, 1, 4), 13],
						[gd(2012, 1, 5), 11], [gd(2012, 1, 6), 11], [gd(2012, 1, 7), 9], [gd(2012, 1, 8), 10],
						[gd(2012, 1, 9), 7], [gd(2012, 1, 10), 11], [gd(2012, 1, 11), 7], [gd(2012, 1, 12), 6],
						[gd(2012, 1, 13), 4], [gd(2012, 1, 14), 5], [gd(2012, 1, 15), 11], [gd(2012, 1, 16), 8],
						[gd(2012, 1, 17), 9], [gd(2012, 1, 18), 16], [gd(2012, 1, 19), 11], [gd(2012, 1, 20), 18],
						[gd(2012, 1, 21), 8], [gd(2012, 1, 22), 17], [gd(2012, 1, 23), 11], [gd(2012, 1, 24), 13],
						[gd(2012, 1, 25), 11], [gd(2012, 1, 26), 11], [gd(2012, 1, 27), 9], [gd(2012, 1, 28), 8],
						[gd(2012, 1, 29), 7], [gd(2012, 1, 30), 8], [gd(2012, 1, 31), 20]
					];

					//sea level pressure
					var tlak = [
						[gd(2012, 1, 1), 1012], [gd(2012, 1, 2), 1018], [gd(2012, 1, 3), 1020], [gd(2012, 1, 4), 1016],
						[gd(2012, 1, 5), 1022], [gd(2012, 1, 6), 1023], [gd(2012, 1, 7), 1029], [gd(2012, 1, 8), 1030],
						[gd(2012, 1, 9), 1029], [gd(2012, 1, 10), 1034], [gd(2012, 1, 11), 1034], [gd(2012, 1, 12), 1023],
						[gd(2012, 1, 13), 1022], [gd(2012, 1, 14), 1026], [gd(2012, 1, 15), 1027], [gd(2012, 1, 16), 1023],
						[gd(2012, 1, 17), 1019], [gd(2012, 1, 18), 1032], [gd(2012, 1, 19), 1029], [gd(2012, 1, 20), 1017],
						[gd(2012, 1, 21), 1015], [gd(2012, 1, 22), 1017], [gd(2012, 1, 23), 1023], [gd(2012, 1, 24), 1024],
						[gd(2012, 1, 25), 1024], [gd(2012, 1, 26), 1022], [gd(2012, 1, 27), 1031], [gd(2012, 1, 28), 1023],
						[gd(2012, 1, 29), 1019], [gd(2012, 1, 30), 1008], [gd(2012, 1, 31), 993]
					];


					var dataset = [
						{
							label: "Tlak",
							data: tlak,         
							color: "#5CB85C",
							bars: {
								show: true, 
								align: "center",
								barWidth: 24 * 60 * 60 * 600,
								lineWidth:1
							}
						}, {
							label: "Systolický pulz",
							data: pulz1,
							yaxis: 2,
							color: "#00C0EF",
							points: { symbol: "circle", fillColor: "#00C0EF", show: true },
							lines: {show:true}
						}, {
							label: "Diastolický pulz",
							data: pulz2,
							yaxis: 3,
							color: "#4592BF",
							points: { symbol: "circle", fillColor: "#4592BF", show: true },
							lines: { show: true }
						}
					];

						
					var options = {
						xaxis: {
							mode: "time",
							tickSize: [3, "day"],        
							tickLength: 0,
							axisLabel: "Datum",
							// show: false,
							axisLabelUseCanvas: true,
							axisLabelFontSizePixels: 12,
							axisLabelFontFamily: 'Verdana, Arial',
							axisLabelPadding: 10,
							color: "black"
						},
						canvas: true,
						yaxes: [{
								position: "right",
								max: 1070,
								min: 1000,
								color: "black",
								axisLabel: "Tlak",
								axisLabelUseCanvas: true,
								axisLabelFontSizePixels: 12,
								axisLabelFontFamily: 'Verdana, Arial',
								axisLabelPadding: 3            
							}, {
								max: 20,
								position: "left",
								clolor: "black",
								axisLabel: "Pulz",
								axisLabelUseCanvas: true,
								axisLabelFontSizePixels: 12,
								axisLabelFontFamily: 'Verdana, Arial',
								axisLabelPadding: 3            
							},{
								max: 20,
								position: "right",
								color: "black",
								axisLabel: "Pulz",
								show: false,
								axisLabelUseCanvas: true,
								axisLabelFontSizePixels: 12,
								axisLabelFontFamily: 'Verdana, Arial',
								axisLabelPadding: 3            
							}
						],
						legend: {
							show: false
						},
						tooltip: true,
						grid: {
							borderWidth: 0,        
							hoverable: true,
							clickable: true
						},
					};

					$.plot($(element), dataset, options);
					$("<div id='tooltip'></div>").css({
						position: "absolute",
						display: "none",
						border: "1px solid #fdd",
						padding: "2px",
						"background-color": "#fee",
						opacity: 0.80
					}).appendTo("body");

					$("#placeholder").bind("plothover", function (event, pos, item) {

						if ($("#enablePosition:checked").length > 0) {
							var str = "(" + pos.x.toFixed(2) + ", " + pos.y.toFixed(2) + ")";
							$("#hoverdata").text(str);
						}

						if ($("#enableTooltip:checked").length > 0) {
							if (item) {
								var x = item.datapoint[0].toFixed(2),
									y = item.datapoint[1].toFixed(2);

								$("#tooltip").html(item.series.label + " of " + x + " = " + y)
									.css({top: item.pageY+5, left: item.pageX+5})
									.fadeIn(200);
							} else {
								$("#tooltip").hide();
							}
						}
					});

					$("#placeholder").bind("plotclick", function (event, pos, item) {
						if (item) {
							$("#clickdata").text(" - click point " + item.dataIndex + " in " + item.series.label);
							plot.highlight(item.series, item.datapoint);
						}
					});

					// Add the Flot version string to the footer

					$("#footer").prepend("Flot " + $.plot.version + " &ndash; ");

				});


			}
		};
	}
]);


