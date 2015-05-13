Sandy.directive('attachments',
	[function() {
		return {
			restrict: 'E',
			scope: {
				files: "="
			},
			replace: true,
			template: '<div><div class="attachment" ng-if="files && files.length"><h4>{{ "ATTACHMENTS" | translate }}:</h4><ul><li class="filename" ng-repeat="att in files"><a href="{{ att.content }}" target="_blank" title="{{ att.name }}">{{ att.name }}</a></li></ul><div></div>',
			// template: '<div class="attachment" ng-if="files && files.length"><h4>{{ "ATTACHMENTS" | translate }}:</h4><p class="filename" ng-repeat="att in files"><a href="{{ att.content }}" target="_blank" title="{{ att.name }}">{{ att.name }}</a></p><div>',
			link: function($scope, element) {
			}
		};
	}]
);
