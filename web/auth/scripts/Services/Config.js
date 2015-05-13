Sandy.factory('Config', [
	'$timeout', '$translate', 'UserSetting',
	function($timeout, $translate, UserSetting) {
		var self = this;

		this.get = function(key, done) {
			UserSetting.get({key: key}, function(val) {
				done(val.value);
			});
		};

		this.getObject = function(key, done) {
			self.get(key, function(val) {
				try {
					done(JSON.parse(val));
				} catch(e) {
					done(false);
				}
			});
		};

		this.save = function(key, val, done) {
			UserSetting.save({key: key}, JSON.stringify({value: val}), done);
		};

		return this;
	}
]);
