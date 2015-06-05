Sandy.controller ( "Base", [
    '$scope', '$rootScope', 'Statistics', '$timeout',
    function ($scope, $rootScope, Statistics, $timeout) {

		$rootScope.$on('$routeChangeSuccess', function(scope, current, pre) {
			$rootScope.currentTitle = current.title;
			$rootScope.currentRoute = current.originalPath ? current.originalPath.slice(1) : '';
			$rootScope.currentPath = $rootScope.currentRoute || 'home';
			console.log('Current route name: ', $rootScope.currentRoute);

			$('#navbar li').removeClass('active');
			$('#navbar li.'+$rootScope.currentPath).addClass('active');
	    });


		$scope.readStatistics = function() {
			Statistics.get({}, function(res) {
				$scope.statistics = res;

				$timeout($scope.readStatistics, 1000);
			});
		};

		$scope.readStatistics();
    }
]);
