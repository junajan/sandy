Sandy.factory('History', [
	'$resource',
	
	function($resource) {
		return $resource($$api + 'history',{}, {});
	}
]);
