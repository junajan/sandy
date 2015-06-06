Sandy.controller ( "Log", [
    '$scope', '$timeout', 'SocketIO',
    function ($scope, $timeout, SocketIO) {
        $scope.data = [];
        var maxLen = 50;
        
        var evHandler = SocketIO.socket.on('logEntry', function(d) {
            $scope.data = d.concat($scope.data);

            if($scope.data.length > maxLen)
                 $scope.data = $scope.data.slice(0, maxLen);
        });

        $scope.$on('$destroy', function() {
            evHandler();
        });
    }
]);
