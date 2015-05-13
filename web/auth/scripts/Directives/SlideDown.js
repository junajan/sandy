Sandy.animation('.ng-slide-down', function() {
	return {
		enter: function(element, done) {
			element.hide().slideDown()
			return function(cancelled) {};
		},
		leave: function(element, done) {
			element.slideUp();
		},
	};
});