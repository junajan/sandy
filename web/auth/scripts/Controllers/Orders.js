Sandy.controller ( "Orders", [
    '$scope', '$timeout', 'Orders', '$location',
    function ($scope, $timeout, Orders, $location) {

			var queryMethod = "query";
			if('/orders-grouped' === $location.path())
				queryMethod = "queryGrouped";

    	$scope.load = function() {
	    	Orders[queryMethod](function(res) {
					$scope.orders = res;
					$scope.load && $timeout($scope.load, 1000);
	    	});
    	};

    	$scope.load();

        $scope.$on('$destroy', function() {
            $scope.load = null;
        });
    }
]);
