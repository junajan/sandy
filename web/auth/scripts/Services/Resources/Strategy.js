Sandy.factory('Strategy', [
	'$resource',
	
	function($resource) {
		return $resource($$api + 'strategy',{}, {});
	}
]);
