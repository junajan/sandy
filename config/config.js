var _ = require('lodash');

var modules = __dirname+"/../modules/";
// var log4js = require('log4js');
var config = require("./env");
var log4js = require('log4js');
var log4jsMemAppender = require("log4js-memory-appender");
var memLogger = log4jsMemAppender({ maxBufferSize : 100000 });

log4js.loadAppender('file');
log4js.loadAppender('memory', memLogger);

var _config = {
    scheduleHour: 5,
    dateOffset: 30,
    api: "/api",
    root: __dirname+"/../",
    dirCore: modules+"Core/",
    dirModule: modules,
    dirStrategy: modules+"Strategy/",
    dirWeb: modules+"Web/",
    dirLoader: modules+"Loader/",
    dirConnector: modules+"Connector/",
};

var appenders = [];

if(config.log.console) {
    appenders.push({
        "level": config.log.consoleLogLevel,
        "type": "logLevelFilter",
        "appender": {
            "type": "console"
        }
    });
}

if(config.log.file) {
    appenders.push({
        "level": config.log.fileLogLevel,
        "type": "logLevelFilter",
        "appender": {
            "type": "file",
            "filename": config.log.file,
            "layout": {
            }
        }
    });
}

log4js.configure({
    "appenders": appenders
});
log4js.addAppender(log4js.appenders.memory());


_config = _.merge(_config, config);
_config.logger = log4js;
_config.memLogger = memLogger;

module.exports = _config;


