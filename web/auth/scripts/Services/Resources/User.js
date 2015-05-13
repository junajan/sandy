Sandy.factory('User', [
	'$resource',
	function($resource) {
		return $resource($$api + 'user', {},
		{	
			changePassword: {
				url: $$api + 'user/password-change',
				method:'PUT'
			},
			update: {
				method:'PUT'
			}
		});
	}
]);