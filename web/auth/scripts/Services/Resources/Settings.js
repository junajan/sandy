Sandy.factory('Settings', [
	'$resource',
	
	function($resource) {
		return $resource($$api + 'setting/:id',{}, {
			save: {
				method:'PUT'
			}
		});
	}
]);
