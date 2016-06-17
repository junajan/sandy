Sandy.factory('Config', [
	'$resource',
	function($resource) {
		return $resource($$config.api + 'config');
	}
]);
