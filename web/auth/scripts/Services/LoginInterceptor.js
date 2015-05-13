Sandy.factory('LoginInterceptor', [
 '$q', '$rootScope',
    function($q, $rootScope) {
        return {
            'responseError': function(rejection) {

                if (rejection.status == 401) {
                    $rootScope.signOut();
                }

                return $q.reject(rejection);
            },
            'response': function (response) {

                if (response.status == 401) {
                    $rootScope.signOut();
                }

                return response || $q.when(response);
            }
        };
    }
]);