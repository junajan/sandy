Sandy.factory('Orders', [
	'$resource',
	function($resource) {
		return $resource($$config.api + 'orders',{}, {
			getOpenPrices: {
				url: $$config.api + 'open-prices'
			},
			queryGrouped: {
				url: $$config.api + 'orders-grouped',
				isArray:true
			}
		});
	}
]);
