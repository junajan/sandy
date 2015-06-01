var mysql = require('mysql');
var _ = require('lodash');
/**
 * MySQL Class for better usage
 * 
 * Usage:
 *     get ( resReport, "*", "u_prava", "1=1", null, "id", "ASC" );
 *     insert ( resReport,"u_prava", {const:"AAA"+ (new Date().getMilliseconds()), "popis": "popis" });
 *     update ( resReport, "u_prava", {const:"BBBB"}, "id IN (?)", [45,47,48] );
 *     sql ( resReport, "SELECT * FROM u_prava WHERE id IN (?)", [1,2,3] );
 *
 * Usage 2:
 * var DB = require('./modules/Mysql')(conf.mysql);
 *    DB.getData("*", "config", DB.print);
 *    DB.get("*", "config", DB.print);
 *    DB.insert("config", {var:"aaa", val:"bbb"}, DB.print);
 *    DB.update("config", {val:"bbb2"}, "var = ?", "aaa", DB.print);
 *    DB.get("*", "config", DB.print);
 *    DB.delete("config", "var = ?", "aaa", DB.print);
 *    DB.getData("*", "config", DB.print);
 */

function MySQLClass(config) {

    var pool = mysql.createPool(config);

    return {
        mysql: pool,
        print: function(err, res) {
            if(err)
                console.log("ERROR: ",err);
            else
                console.log("RESULT: ", res);
            console.log("======================");
        },
        getCallback: function(params) {
            var cb = function(){};

            if(params.length && _.isFunction(params[params.length-1])) {
                cb = params[params.length-1];
                delete params[params.length-1];
            }
            return cb;
        },
        getData: function() {
            var cb = this.getCallback(arguments);
            var args = arguments;

            pool.getConnection(function(err, conn) {

                if (err) {
                    throw err;
                } else {

                    var sql = "";
                    if (args[0])
                        sql = "SELECT " + args[0];

                    if (args[1])
                        sql += " FROM " + args[1];

                    if (args[2])
                        sql += " WHERE " + args[2];

                    if (args[4])
                        sql += " ORDER BY " + args[4];

                    if (args[4] && args[5])
                        sql += " " + args[5];

                    if (args[6])
                        sql += " LIMIT " + args[6];

                    if (config.showSQL)
                        console.log("SELECT: " + sql + " | PARAMS: " + JSON.stringify(args[3]));

                    var q = conn.query(sql, args[3], function(err, rows) {
                        if(err)
                            console.error(q.sql);
                        
                        cb(err, rows);
                        conn.release()
                    });
                }
            });
        },
        get: function() {
            var cb = this.getCallback(arguments)
            var args = arguments;

            this.getData(args[0],args[1],args[2],args[3],args[4],args[5],1,function(err, res) {
                cb && cb(err, res ? res[0]: null);
            });
        },
        insert: function() {
            var cb = this.getCallback(arguments);
            var args = arguments;
            
            pool.getConnection(function(err, conn) {
                if (err) {
                    throw err;
                    // cb(err) && conn && conn.release();
                } else {
                    where = "INSERT ";
                    if(args[2]) where += 'IGNORE ';
                    where += "INTO " + args[0] + " SET ? ";

                    if (config.showSQL)
                        console.log("INSERT: " + where + " | PARAMS: " + JSON.stringify(args[1]));

                    var q = conn.query(where, args[1], function(err, res) {
                        if(err)
                            console.error(q.sql);

                        conn.release();
                        cb(err, res);
                    });
                }
            });
        },
        insertValues: function() {
            var cb = this.getCallback(arguments);
            var args = arguments;
            
            pool.getConnection(function(err, conn) {
                if (err) {
                    throw err;
                    // cb(err) && conn && conn.release();
                } else {
                    where = "INSERT ";
                    if(args[2]) where += 'IGNORE ';
                    where += "INTO " + args[0] + " VALUES ? ";

                    if (config.showSQL)
                        console.log("INSERT VALUES: " + where + " | PARAMS: " + JSON.stringify(args[1]));

                    var q = conn.query(where, [args[1]], function(err, res) {
                        if(err)
                            console.error(q.sql);
                        
                        conn.release();
                        cb(err, res);
                    });
                }
            });
        },
        update: function(where, values, cond, params) {
            var cb = this.getCallback(arguments);
            var args = arguments;
            
            pool.getConnection(function(err, conn) {

                if (err) {
                    throw err;
                } else {

                    var sql = "UPDATE " + args[0] + " SET ";
                    var sqlVals = [];
                    var arr = [];

                    for (var j in values) {

                        if (j[0] == ".")
                            sqlVals.push(j.substr(1) + " = " + args[1][j])
                        else {
                            sqlVals.push(j + " = ?")
                            arr.push(values[j]);
                        }
                    }

                    sql += sqlVals.join(", ");

                    if (args[2])
                        sql += " WHERE " + args[2];

                    if (!(args[3] instanceof Array))
                        args[3] = [args[3]];

                    for (var i in args[3])
                        arr.push(args[3][i]);

                    if (config.showSQL)
                        console.log("UPDATE: " + sql + " | PARAMS: " + JSON.stringify(arr));

                    var q = conn.query(sql, arr, function(err, res) {
                        if(err)
                            console.error(q.sql);
                        
                        conn.release();
                        cb(err, res)
                    });
                }
            });
        },
        delete: function(where, cond, params) {
            var cb = this.getCallback(arguments);
            var args = arguments;
            
            pool.getConnection(function(err, conn) {

                if (err) {
                    throw err;
                } else {

                    var sql = "DELETE FROM " + args[0] + " WHERE " + args[1];
                    
                    if (!(args[2] instanceof Array))
                        args[2] = [args[2]];

                    if (config.showSQL)
                        console.log("DELETE: " + sql + " | PARAMS: " + JSON.stringify(args[2]));

                    var q = conn.query(sql, args[2], function(err, res) {
                        if(err)
                            console.error(q.sql);
                        
                        conn.release();
                        cb(err, res)
                    });
                }
            });
        },
        sql: function(sql, params) {
            var cb = this.getCallback(arguments);
            var args = arguments;
            
            pool.getConnection(function(err, conn) {
                if (err) {
                    throw err;
                } else {
                    if (config.showSQL)
                        console.log("SQL: " + args[0] + " | PARAMS: " + JSON.stringify(args[1]));
                    var q = conn.query(sql, params, function(err, rows) {
                        if(err)
                            console.error(q.sql);
                        
                        conn.release();
                        cb(err, rows)
                    });
                }

            });
        }
    };

};

// Export this file as a module
module.exports = MySQLClass;