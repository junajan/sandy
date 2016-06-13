"use strict";

module.exports = function(options){
    var layouts = require('log4js').layouts;
    var buffer = null;
    var maxBufferSize = null;

    options = options || {};
    buffer = options.buffer || [];
    maxBufferSize = options.maxBufferSize || 100;

    var memoryAppender = function(layout, timezoneOffset) {
        layout = layout || layouts.basicLayout;
        return function(loggingEvent) {
            if((buffer.length + 1) > maxBufferSize)
            {
                var numtoRemove = (buffer.length - maxBufferSize) + 1;
                if(numtoRemove > 0){ buffer.splice(0, numtoRemove); }
            }
            buffer.push(layout(loggingEvent, timezoneOffset));
        };
    };

    var configure = function(config) {
        var layout = null;
        if (config.layout) {
            layout = layouts.layout(config.layout.type, config.layout);
        }
        if(config.maxBufferSize){
            maxBufferSize = config.maxBufferSize;
        }
        return memoryAppender(layout, config.timezoneOffset);
    };

    var getBuffer = function(){
        return(buffer.slice());
    };

    var flushBuffer = function(){
        buffer = [];
    };

    return({
        appender: memoryAppender,
        configure: configure,
        getBuffer: getBuffer,
        flushBuffer: flushBuffer
    });
};
