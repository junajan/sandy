Sandy.controller ( "Watchlist", [
	'$scope', 'Watchlist', '$timeout',
	function ($scope, Watchlist, $timeout) {
		$scope.indicators = {
			date: null,
			watchlist: {}
		}

		$scope.load = function() {
			Watchlist.query(function(res) {
				$scope.list = res;
				$scope.load && $timeout($scope.load, 1000);
			});

			Watchlist.getIndicators(function(res) {
				$scope.indicators = res;
				$scope.indicators.healthyPercent = parseInt((res.healthy / res.total) * 100, 10)

			});
		};

		$scope.load();

		$scope.$on('$destroy', function() {
				$scope.load = null;
		});
	}
]);
