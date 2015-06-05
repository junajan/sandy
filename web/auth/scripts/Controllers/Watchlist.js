Sandy.controller ( "Watchlist", [
    '$scope', 'Watchlist', '$timeout',
    function ($scope, Watchlist, $timeout) {

    	$scope.load = function() {
	    	Watchlist.query(function(res) {
				$scope.list = res;

				$scope.load && $timeout($scope.load, 1000);
	    	});
    	};

    	$scope.load();
        
        $scope.$on('$destroy', function() {
            $scope.load = null;
        });
    }
]);
