var express = require('express');
var http = require('http');
var fs = require('fs');
var moment = require('moment');
var reload = require('reload');
var socketIO = require('socket.io');
var stripAnsi = require("strip-ansi");

module.exports = (function() {
    var self = this;
    this.app = express();

    this.run = function(conf) {
        var server = http.createServer(self.app);

        server.listen(conf.port, function(){
            console.log("Express server listening on http://localhost:%s", conf.port);
        });

        if(conf.livereload)
            reload(server, self.app, conf.livereloadTime || 2000);

        var log = [];
        var maxLen = 500;

        var io = socketIO(server);

        io.on('connection', function (socket) {
            // console.log("Client has connected to socket.io server");
            socket.emit('logEntry', log);
            socket.on('getLog', function(cb) {
                cb(log);
            });

            self.app.on("API.time", function(time) {
                time = moment(time* 1000).format("HH:mm:ss");
                socket.emit("API.time", time);
            });
            self.app.on("API.connection", function(state) {
                socket.emit("API.connection", state);
            });


            socket.emit("API.connection", self.app.apiConnection);
        });
        var tail = require('child_process').spawn("tail", ["-f", "-n 200", conf.logFile]);

        tail.stdout.on("data", function (data) {
            var newData = data.toString().trim();
            newData = stripAnsi(newData).split('\n').reverse();
            io.emit('logEntry', newData);

            log = newData.concat(log);
            
            if(log.length > maxLen)
                 log = log.slice(0, maxLen);
        });
                
        return self.app;
    };

    return this;
})();