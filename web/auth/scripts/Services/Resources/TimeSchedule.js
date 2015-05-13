Sandy.factory('TimeSchedule', [
	'$resource',
	
	function($resource) {
		return $resource($$api + 'time-schedule',{}, {});
	}
]);
