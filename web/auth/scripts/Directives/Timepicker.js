Sandy.directive('timepicker', function() {
  return {
    restrict: 'AE',
    require: 'ngModel',
    scope: {
      model: '=ngModel'
    },
    link: function(scope, element, attrs, ngModelCtrl) {

      scope.$watch("model", function(val) {
        $(element).val(val);

        $(element).timepicker({
          showMeridian:false
        }).on('changeDate', function(e) {
          ngModelCtrl.$setViewValue(e.date);
        });
      });
    }
  };
});