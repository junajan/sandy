Sandy.directive('chart', [
	'$timeout',
	function($timeout) {
		return {
			restrict: 'E',
			replace: true,
			scope: {
				data: '=',
			},
            template: '<div class="chart" style="height: 450px; width: 100%;"></div>',
			link: function($scope, element, attrs) {
				var len = 0;
				var chart = null;
				var s1 = {name: 'Equity curve', data: [], id: "s1"};
				var s2 = {name: 'Unused capital', data: [], id: "s2"};
				var conf = {
					chart: {
			            zoomType: 'x'
			        },
			        title: {
			            text: 'Equity & Capital usage',
			            x: -20 //center
			        },
			        subtitle: {
			            text: '-- sandy bot --',
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
			        tooltip: {
		                xDateFormat: '%Y-%m-%d',
					    backgroundColor: '#FCFFC5',
					    borderColor: 'black',
					    borderRadius: 10,
					    borderWidth: 3,
			        	valueSuffix: '$'
					},
			        plotOptions: {
			            line: {
			                dataLabels: {
			                    enabled: true
			                },
			                enableMouseTracking: false
			            }
			        },
			        yAxis: {
			            title: {
			                text: 'Capital'
			            }
			        },
			        series: [s1]
			    };

				$timeout(function() {

				    chart = $('.chart').highcharts(conf, function(ch) {
				
						$scope.$watch('data', function(data) {
							if(data.length == len || !chart) return;
							len = data.length;
							var d = [];

							for(var i in data) {
								var date = (new Date(data[i].date)).getTime();
								if(date) {
									d.push([date, data[i].capital])
								}
							}

							ch.get('s1').setData(d);
						});
				    });
				});

			}
		};
	}
]);
