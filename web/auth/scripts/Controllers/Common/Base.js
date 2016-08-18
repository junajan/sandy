Sandy.controller ( "Base", [
    '$scope', '$rootScope', 'Statistics', '$timeout', 'SocketIO', 'Orders',
    function ($scope, $rootScope, Statistics, $timeout, SocketIO, Orders) {

		$rootScope.$on('$routeChangeSuccess', function(scope, current, pre) {
			$rootScope.currentTitle = current.title;
			$rootScope.currentRoute = current.originalPath ? current.originalPath.slice(1) : '';
			$rootScope.currentPath = $rootScope.currentRoute || 'home';
			console.log('Current route name: ', $rootScope.currentRoute);

			$('#navbar li').removeClass('active');
			$('#navbar li.'+$rootScope.currentPath).addClass('active');
	    });

		$scope.loadOpenPrices = function() {
			Orders.getOpenPrices({}, function(res) {
				$rootScope.openTickersPrices = res;
				$timeout($scope.loadOpenPrices, 2000);
			});
		};


		$scope.readStatistics = function() {
			Statistics.get({}, function(res) {
				$scope.statistics = res;

				$timeout($scope.readStatistics, 1000);
			});
		};

		$rootScope.countActualProfitLoss = function (orders) {
			$rootScope.actualProfitLoss = 0;
			var count = 0;

			if(!$rootScope.openTickersPrices)
				return false;

			var openPrices = $rootScope.openTickersPrices;
			for(var i in orders) {
				var order = orders[i];
				if(order.close_date)
					break;

				if(!openPrices[order.ticker])
					return false;

				count += (openPrices[order.ticker] - order.open_price) * order.amount;
			}
			$rootScope.actualProfitLoss = count
		};

		$scope.readStatistics();
		$scope.loadOpenPrices();
    }
]);
