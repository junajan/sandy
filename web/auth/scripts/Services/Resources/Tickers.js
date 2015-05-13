Sandy.factory('Tickers', [
	'$resource',
	function($resource) {
		return $resource($$api + 'ticker',{}, {});
	}
]);
