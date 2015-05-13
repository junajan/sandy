Sandy.directive('datatable',
	['$timeout',
	function( $timeout ) {
		return {
			restrict: 'A',
			link: function(scope, el) {
				$timeout(function() {
	                $(el).dataTable();
				});
			}
		};
	}]
);
