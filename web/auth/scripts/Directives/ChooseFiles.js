Sandy.directive('chooseFiles',
	[function() {
		return {
			restrict: 'E',
			scope: {
				files: "="
			},
			templateUrl: '/app/views/Directives/ChooseFiles.html',
			link: function($scope, element) {
				$scope.fileInputs = [0];

				$scope.removeFile = function(index) {
					$scope.files.splice(index, 1);
				};

				$scope.addFile = function(list, file) {
					$scope.fileInputs.push($scope.fileInputs.length);
					if(angular.isArray(file))
						file.forEach(function(item) {
							$scope.files.push(item);
						});
					else
						$scope.files.push(file);
				};
			}
		};
	}]
);
