Sandy.controller ( "Orders", [
    '$scope', '$timeout', 'Orders',
    function ($scope, $timeout, Orders) {

    	$scope.load = function() {
	    	Orders.query(function(res) {
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
