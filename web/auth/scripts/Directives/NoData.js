Sandy.directive('noData',
	[function() {
		return {
			restrict: 'E',
			replace: true,
			template: '<td cols="100%">Zatím zde nejsou žádné záznamy</td>',
			link: function($scope, element) {}
		};
	}]
);
