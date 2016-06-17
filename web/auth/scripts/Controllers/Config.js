Sandy.controller ( "Config", [
    '$scope', '$timeout', 'Config',
    function ($scope, $timeout, Config) {

    	$scope.load = function() {
	    	Config.query(function(res) {
				$scope.config = res;
	    	});
    	};

    	$scope.load();

        $scope.$on('$destroy', function() {
            $scope.load = null;
        });
    }
]);
