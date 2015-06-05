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

        return self.app;
    };

    return this;
})();