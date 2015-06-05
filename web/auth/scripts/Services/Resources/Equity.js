Sandy.factory('Equity', [
	'$resource',
	function($resource) {
		return $resource($$config.api + 'equity',{}, {
			get: {
				isArray:true
			}
		});
	}
]);
