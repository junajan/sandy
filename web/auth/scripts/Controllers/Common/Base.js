Sandy.controller ( "Base", [
    '$scope', '$rootScope', '$location', '$route',
    function ($scope, $rootScope, $location, $route) {

		$rootScope.signOut = function() {
			window.location = '/logout';
		};

		$rootScope.$on('$routeChangeSuccess', function(scope, current, pre) {
			$rootScope.currentTitle = current.title;
			$rootScope.currentRoute = current.originalPath;
			console.log('Current route name: ', current.originalPath );
	    });
    }
]);
