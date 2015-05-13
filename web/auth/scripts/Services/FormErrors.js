Sandy.service("FormErrors", [
	'$rootScope', '$translate',
	function($rootScope, $translate) {
		var self = this;
		this.fill = function(el, err, container) {
			self.hideAll();
			container = container || 'body';

			if ($.isPlainObject(err)) {
				$.each(err, function(ind, val) {

					var item = $(el, container).find("*[name=" + ind + "]");
					
					item.parent().addClass("has-error");

					e = val[0];
					if ($.type(val) === "string")
						e = val;
					console.log(el, container, ind, e);

					$translate(e).then(function(val) {
						msg = "<div class='errorMsg error'>" + val + "</div>";
						item.after(msg);
					}, function(val) {
						msg = "<div class='errorMsg error'>" + e + "</div>";
						item.after(msg);
					});
				});
			} else {

				$translate(err).then(function(val) {
					msg = "<p class='errorMsg error col-lg-12'>" + val + "</p>";
					$(el).prepend(msg);
				}, function(val) {
					msg = "<p class='errorMsg error col-lg-12'>" + err + "</p>";
					$(el).prepend(msg);
				});
			}
		};

		this.hideAll = function(el) {

			$(el).find(".has-error").removeClass("has-error");
			$(el).find(".errorMsg").fadeOut().remove();
		};
	}
]);