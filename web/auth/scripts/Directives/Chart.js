Sandy.directive('chart', [
	'$timeout',
	function($timeout) {
		return {
			restrict: 'E',
			replace: true,
			scope: {
				data: '='
			},
			template: '<div class="chart" style="height: 450px; width: 100%;"></div>',
			link: function($scope, element, attrs) {
				var len = 0;
				var chart = null;
				var s1 = {
					name: 'Transfer Adjusted Equity',
					data: [],
					id: "s2",
					color: Highcharts.getOptions().colors[0]
				};

				var s2 = {
					name: 'Real Equity',
					data: [],
					visible: false,
					id: "s1",
					color: Highcharts.getOptions().colors[3]
				};

				// var s2 = {name: 'Unused capital', data: [], id: "s2"};
				var conf = {
					chart: {
						zoomType: 'x',
						resetZoomButton: {
							position: {
								align: 'left', // right by default
								verticalAlign: 'top',
								x: 10,
								y: 10
							},
							relativeTo: 'chart'
						}
					},
					title: {
						text: 'Equity history',
						x: -20 //center
					},

					plotOptions: {
						line: {
							dataLabels: {
								enabled: true
							}
						}
					},
					tooltip: {
						xDateFormat: 'Date: %Y-%m-%d',
						pointFormat: 'Equity: ${point.y}'
					},
					subtitle: {
						text: '-- Sandy bot --',
						x: -20
					},
					xAxis: {
						type: 'datetime',
						dateTimeLabelFormats: {
							month: '%e. %b',
							year: '%b'
						},
						title: {
							text: 'Date'
						}
					},
					yAxis: {
						title: {
							text: 'Capital'
						},
						labels: {
							formatter: function () {
								return '$'+this.value;
							}
						}
					},
					series: [s2, s1]
				};

				$timeout(function() {

				    chart = $('.chart').highcharts(conf, function(ch) {
				
						$scope.$watch('data', function(data) {
							if(data.length == len || !chart) return;
							len = data.length;
							var d1 = [];
							var d2 = [];

							for(var i in data) {
								var date = (new Date(data[i].date)).getTime();
								if(date) {
									d1.push([date, parseInt(data[i].capital)])
									d2.push([date, parseInt(data[i].adjCapital)])
								}
							}

							ch.get('s2').setData(d1);
							ch.get('s1').setData(d2);
						});
					});
				});

			}
		};
	}
]);
