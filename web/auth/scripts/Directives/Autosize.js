
Sandy.directive('autosize',
	['$timeout',
	function( $timeout ) {
		return {
			restrict: 'A',
			link: function(scope, element) {
				$timeout(function() {
					var el = ($(element).prop('tagName') == 'TEXTAREA') ? $(element) : $('textarea', element);
					var p = el.attr('placeholder');
					el.attr('placeholder', '').autosize({append :''}).show().trigger('autosize.resize').attr('placeholder', p);
				});
			}
		};
	}]
);
