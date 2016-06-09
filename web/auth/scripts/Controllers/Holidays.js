Sandy.controller ( "Holidays", [
    '$scope', 'Holidays',
    function ($scope, Holidays) {

    	$scope.load = function() {
	    	Holidays.query(function(res) {
				$scope.holidays = res;
	    	});
    	};

    	$scope.load();
        $scope.$on('$destroy', function() {
            $scope.load = null;
        });
    }
]);
