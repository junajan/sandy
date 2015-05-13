Sandy.controller ( "Settings", [
    '$scope', '$rootScope', '$location', 'Settings', 'ModalService',
    function ($scope, $rootScope, $location, Settings, ModalService) {
    	
    	$scope.add = function(id) {
			
			ModalService.showModal({
				templateUrl: '/views/modals/SettingsAdd.html',
				controller: "SettingsAdd",
				inputs: {
					info: id
				},
			}).then(function(modal) {
				modal.element.modal();
				modal.close.then(function(result) {
					if(result)
    					$scope.load();
				});
			});
    	};

    	$scope.load = function() {
	    	Settings.get(function(res) {
				$scope.list = res;
	    	});
    	};

    	$scope.load();
    }
]);
