Sandy.factory('Notifications', [
	'$resource',
	
	function($resource) {
		return $resource($$api + 'notification',{}, {});
	}
]);
