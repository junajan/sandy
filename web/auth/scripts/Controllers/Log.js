Sandy.controller ( "Log", [
    '$scope', '$timeout', 'Log', 
    function ($scope, $timeout, Log) {
    	
    	$scope.load = function() {
	    	Log.query(function(res) {
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
