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
          $rootScope.countActualProfitLoss(res)
	    	});
    	};

    	$scope.load();

			$scope.$on('$destroy', function() {
					$scope.load = null;
			});
    }
]);
