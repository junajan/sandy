Sandy.factory('Log', [
	'$resource',
	function($resource) {
		return $resource($$config.api + 'log',{}, {});
	}
]);
