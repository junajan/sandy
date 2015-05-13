Sandy.directive('datepicker', function() {
    return {
        restrict: 'AE',
        require : 'ngModel',
        scope: {
            model: '=ngModel'
        },
        link: function(scope, element, attrs, ngModelCtrl) {
          
          scope.$watch("model", function(val) {
            $(element).val(val);
          });

          $(element).datepicker({
            dateFormat:'dd. MM. yyyy'
          }).on('changeDate', function(e) {
            ngModelCtrl.$setViewValue(e.date);
    		    $(this).datepicker('hide');
          });
        }
    };
});
