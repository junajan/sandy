Sandy.factory('Loading', [
	'$timeout', '$translate',
	function($timeout, $translate) {
		var self = this;
		var loadings = {};
		var timeoutTemplate = '';
		
		$translate('LOADING').then(function (t) {
			timeoutTemplate = '<div class="loading" style="display: none;"̈́><span><i class="fa fa-spinner fa-spin"></i>'+t+'</span></div>';
		});

		// remove scheduled loading on given element
		this.cancelScheduled = function(el) {
			if(loadings[el]) {
				$timeout.cancel(loadings[el]);
				delete loadings[el];
			}
		};

		this.show = function(el, delay, timeout) {
			var d = delay || 0;
			var t;
			var e = el || 'body';

			self.cancelScheduled(e);
			// schedule loading with given delay or 0ms
			// and register sceduled loading to list
			loadings[e] = $timeout(function() {
				console.log("Loading Start: ", e);

				$(e).prepend(timeoutTemplate);
				$(e+ ' .loading').fadeIn('fast');
			}, delay);

			// if there is timeout for loading, schedule it too
			if(timeout) {

				$timeout(function() {
					self.hide(e);
				}, timeout);
			}
		};

		// hide loading or cancel scheduled 
		this.hide = function(el) {
			var e = el || 'body';
			self.cancelScheduled(e);

			console.log("Loading End: ", e);
			$(e+' .loading').fadeOut('fast', function() {
				$(this).remove();
			});
		};
		
		return this;
	}
]);
