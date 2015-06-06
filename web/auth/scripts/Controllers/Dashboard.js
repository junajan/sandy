Sandy.controller ( "Dashboard", [
    '$scope', 'Equity', 'Orders', '$timeout',
    function ($scope, Equity, Orders, $timeout) {
    	$scope.equity = [];

    	$scope.load = function() {
            var from = ($scope.equity && $scope.equity.length) ? $scope.equity[$scope.equity.length-1].date : null;
	    	Equity.get({from: from}, function(res) {
				$scope.equity = $scope.equity.concat(res);

				$scope.load && $timeout($scope.load, 2000);
	    	});

	    	Orders.query({limit: 15}, function(res) {
				$scope.orders = res;
	    	});
    	};

    	$scope.load();
        $scope.$on('$destroy', function() {
            $scope.load = null;
        });
    }
]);
