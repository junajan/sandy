Sandy.controller ( "UserSettings", [
    '$scope', '$rootScope', 'User', 'FormErrors', 'Notify',
    function ($scope, $rootScope, User, FormErrors, Notify) {
        $scope.pass = {
        	password_new: '',
        	password_old: '',
        };

        $scope.getDefaultPass = function() {

        	return angular.copy({
	        	password_new: '',
	        	password_old: '',
	        });
        };

        $scope.changePassword = function() {
        	FormErrors.hideAll('.passChangeForm');
        	var err = {};

        	if(!$scope.pass.password_old)
        		err.password_old = 'password_old is required';

        	if($scope.pass.password_new.length < 5)
        		err.password_new = 'ERR_PASSWORD_IS_TOO_SHORT';

        	if($scope.pass.password_new != $scope.pass.password_new2)
        		err.password_new2 = 'ERR_PASSWORD2_IS_NOT_SAME';
        	
        	if(Object.keys(err).length)
        		return FormErrors.fill('.passChangeForm', err);

        	User.changePassword($scope.pass, function(res) {
        		if(res.ok) {
	        		$scope.pass = $scope.getDefaultPass();
                    return Notify.addTranslate('NOTIFY.PASSWORD_CHANGE_SUCCESS');
                }
                FormErrors.fill('.passChangeForm', res.error);
                return Notify.addTranslate('NOTIFY.PASSWORD_CHANGE_FAILED', Notify.ERROR);
        	});
        };


        $scope.init = function() {

	        $scope.pass = $scope.getDefaultPass();
        };
    }
]);
