Sandy.factory('Watchlist', [
	'$resource',
	function($resource) {
		return $resource($$config.api + 'watchlist',{}, {
      getIndicators: {
        url: $$config.api + 'watchlist-indicators'
      }
		});
	}
]);
