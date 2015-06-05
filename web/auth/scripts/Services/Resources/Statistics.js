Sandy.factory('Statistics', [
	'$resource',
	function($resource) {
		return $resource($$config.api + 'statistics',{}, {});
	}
]);
