Sandy.directive('calendar', [
	'$compile', '$timeout', 'ModalService', 'Calendar', '$filter', '$rootScope',
	function($compile, $timeout, ModalService, Calendar, $filter, $rootScope) {
		return {
			restrict: 'EA',
			replace: true,
			scope: {
				// events: '=',
			},
			template: '<div><a ng-click="create()"></a><div style="width: 100%" class="calendar"></div>',
			link: function($scope, element, attrs) {
				var eventCollorValid = '#3c8dbc';
				var eventCollorUnconfirmed = '#f39c12';
				var FullCalendar = $(".calendar", element);
				$scope.events = [];

				$scope.render = function(event) {
					FullCalendar.fullCalendar('updateEvent', event);
				};

				$scope.refreshCalendar = function() {
					FullCalendar.fullCalendar("refetchEvents");
				};

				$scope.modalEditClose = function(modal) {
					modal.element.modal();
					modal.close.then($scope.refreshCalendar);
				};

				$scope.addTask = function(info, jsEvent, view ) {
					
					ModalService.showModal({
						templateUrl: 'views/Modal/CalendarEventAdd.html',
						controller: "CalendarEventAdd",
						inputs: {
							info: info
						},
					}).then($scope.modalEditClose);
				};

				$scope.showDetail = function (calEvent, event, view) {
					
					ModalService.showModal({
						templateUrl: 'views/Modal/CalendarEventDetail.html',
						controller: "CalendarEventDetail",
						inputs: {
							info: calEvent
						},
					}).then(function(modal) {
						modal.element.modal();
						modal.close.then(function(result) {
							if(result == -1 )
								$scope.refreshCalendar();
							else if(result > 0)
								$scope.addTask(result);
						});
					});
				};

				$scope.getItemColor = function(status) {
					var statuses = $$config.calendarEventColors;
					if(statuses[status])
						return statuses[status];
					return statuses['default'];
				};

				$scope.getItemStatus = function(item) {
					console.log("Event: status: doctor - ", item.statusByDoctor, " : patient - ", item.statusByPatient);

					if(item.statusByDoctor === 1 && item.statusByPatient === 1)
						return 'valid';
					if(item.statusByDoctor === 3 ||  item.statusByPatient === 3)
						return 'cancelled';
					if(item.statusByDoctor === 2 || item.statusByPatient === 2)
						return 'done';

					if($rootScope.user.role === 'user') {
					
						if(item.statusByDoctor === 0 && item.statusByPatient === 1)
							return 'waiting_for_accept';
						if(item.statusByDoctor === 1 && item.statusByPatient === 0)
							return 'unaccepted';
					
					} else {
					
						if(item.statusByDoctor === 0 && item.statusByPatient === 1)
							return 'unaccepted';
						if(item.statusByDoctor === 1 && item.statusByPatient === 0)
							return 'waiting_for_accept';
					}

					return 'default';
				};

				FullCalendar.fullCalendar({
					editable: true, //Enable drag and drop
					events: function(start, end, callback) {
				        var start = moment(start).format("YYYY-MM-DD");
						var end = moment(end).format("YYYY-MM-DD")
						
						Calendar.get({from: start, to: end}, function(res) {
							var events = [];

							res.forEach(function(item) {
								item.status = $scope.getItemStatus(item);
								var color = $scope.getItemColor(item.status);
								var time = moment(item.date).format("HH:MM");

								events.push({
									title: $filter('characters')(time+" - "+item.notes, 30),
									start: new Date(item.date),
									backgroundColor: color,
									borderColor: color,
									info: item
								});
							});

							callback(events);
						});
				    },
					monthNames: ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'],
					dayNamesShort: ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'],
					firstDay: 1,
					buttonText: {
						prev: "<span class='fa fa-caret-left'></span>",
						next: "<span class='fa fa-caret-right'></span>",
						today: 'today',
						month: 'month',
						week: 'week',
						day: 'day'
					},
					header: {
						left: 'title',
						center: '',
						right: 'prev,next'
					},
					eventClick: $scope.showDetail,
					dayClick: $scope.addTask
				});


			}
		};
	}
]);


