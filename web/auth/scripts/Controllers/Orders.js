Sandy.controller ( "Orders", [
    '$scope', '$timeout', 'Orders', '$location', '$rootScope',
    function ($scope, $timeout, Orders, $location, $rootScope) {

			var queryMethod = "query";
			if('/orders-grouped' === $location.path())
				queryMethod = "queryGrouped";

    	$scope.load = function() {
	    	Orders[queryMethod](function(res) {
					$scope.orders = res;
					$scope.load && $timeout($scope.load, 1000);

					var mapped = res.map(function (item) {
						return {
							ticker: item.ticker,
							amount: item.amount,
							open_price: item.open_price_total / item.amount,
              close_date: item.close_date,
						}
          })
						.filter(function (item) {
							return !item.close_date
            })

          $rootScope.countActualProfitLoss(mapped)
	    	});
    	};

    	$scope.load();

			$scope.$on('$destroy', function() {
					$scope.load = null;
			});
    }
]);
