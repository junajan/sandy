Sandy.controller ( "Tickers", [
    '$scope', '$rootScope', '$location', 'Tickers', 'ModalService',
    function ($scope, $rootScope, $location, Tickers, ModalService) {
   		$scope.tickers = [];
    	
    	Tickers.get({}, function(res) {
    		$scope.tickers = res.data;
    		console.log(res);
    	});

   //  	$scope.add = function(id) {
			
			// ModalService.showModal({
			// 	templateUrl: '/views/modals/SettingsAdd.html',
			// 	controller: "SettingsAdd",
			// 	inputs: {
			// 		info: id
			// 	},
			// }).then(function(modal) {
			// 	modal.element.modal();
			// 	modal.close.then(function(result) {
			// 		if(result)
   //  					$scope.load();
			// 	});
			// });
   //  	};

   //  	$scope.load = function() {
	  //   	Settings.get(function(res) {
			// 	$scope.list = res;
	  //   	});
   //  	};

   //  	$scope.load();
    }
]);
