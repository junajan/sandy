Sandy.controller ( "Dashboard", [
    '$scope', 'Equity', 'Orders', '$timeout', '$rootScope',
    function ($scope, Equity, Orders, $timeout, $rootScope) {
    	$scope.equity = [];
    	$scope.transfers = [];

    	$scope.load = function() {
				var from = ($scope.equity && $scope.equity.length) ? $scope.equity[$scope.equity.length-1].date : null;
	    	Equity.get({from: from}, function(res) {

					$scope.equity = $scope.equity.concat(res.equity);
					$scope.transfers = $scope.transfers.concat(res.transfers);
					$scope.load && $timeout($scope.load, 2000);
				});

	    	Orders.query({limit: 20}, function(res) {
					$scope.orders = res;
					$rootScope.countActualProfitLoss(res)
	    	});
    	};

    	$scope.load();
        $scope.$on('$destroy', function() {
            $scope.load = null;
        });
    }
]);
