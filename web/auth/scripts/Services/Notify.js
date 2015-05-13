Sandy.factory('Notify', [
	'$timeout', '$translate',
	function($timeout, $translate) {
		var self = this;
		var base = $('.right-side');
		// notify types
		this.SUCCESS 	= 'success';
		this.INFO 	= 'info';
		this.WARNING 	= 'warn';
		this.ERROR 	= 'error';

		// add notify
		this.add = function(text, type) {
			console.log("NOTIFY: ", text, type);
			$.notify(text, type || self.SUCCESS);
		};

		// add notify and translate text via $translate provider
		this.addTranslate = function(text, type) {
			console.log("NOTIFY TRANSLATE: ", text, type);
			$translate(text).then(function(t) {
				self.add(t, type);
			});
		};

		return this;
	}
]);
