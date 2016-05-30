Sandy.factory('Holidays', [
	'$resource',
	function($resource) {
		return $resource($$config.api + 'holidays',{});
	}
]);
