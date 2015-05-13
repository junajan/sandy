Sandy.controller ( 'SettingsAdd',	[
	'$scope', '$element', 'info', 'close', '$rootScope', 'Settings',
	function ($scope, $element, info, close, $rootScope, Settings) {
    	$scope.info = info;

		$scope.close = function(result) {
			close(result, 500);
		};

    	$scope.save = function(info) {
    		Settings.save(info, function(res) {
    			if(res.ok)
    				return $scope.close(1);
				alert(res.error);
    		});
    	}
	}]
);
