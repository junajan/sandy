var express = require('express');
var http = require('http');
var fs = require('fs');
var reload = require('reload');

module.exports = (function() {
    var self = this;
    this.app = express();

    this.run = function(conf) {
        var server = http.createServer(self.app);

        server.listen(conf.port, function(){
            console.log("Express server listening on port " + conf.port);
        });

        if(conf.livereload)
            reload(server, self.app, conf.livereloadTime || 2000);

        var log = [];
        var maxLen = 200;

        var io = require('socket.io')(server);

        io.on('connection', function (socket) {
            console.log("Client has connected to socket.io server");
            socket.emit('logEntry', log);
            socket.on('getLog', function(cb) {
                cb(log);
            });
        });

        var tail = require('child_process').spawn("tail", ["-f", "-n 200", conf.logFile]);

        tail.stdout.on("data", function (data) {
            var newData = data.toString().trim().split('\n').reverse();
            io.emit('logEntry', newData);

            log = newData.concat(log);
            
            if(log.length > maxLen)
                 log = log.slice(0, maxLen);
        });
                
        return self.app;
    };

    return this;
})();