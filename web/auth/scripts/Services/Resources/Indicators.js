Sandy.factory('Indicators', [
	'$resource',
	
	function($resource) {
		return $resource($$api + 'indicator',{}, {});
	}
]);
