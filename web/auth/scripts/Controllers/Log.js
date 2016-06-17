Sandy.controller ( "Log", [
    '$scope', '$timeout',
    function ($scope, $timeout) {
        $scope.data = [];
        var maxLen = 50;
        var socket = $scope.socket;

        function updateLog(d) {
            $scope.data = d.concat($scope.data);

            if($scope.data.length > maxLen)
                 $scope.data = $scope.data.slice(0, maxLen);
        }

        socket.emit('getLog', function(res) {
            $scope.data = res;
        });
        socket.on('logEntry', updateLog);

        $scope.$on('$destroy', function() {
            socket.removeListener('connection', updateLog);
        });
    }
]);
