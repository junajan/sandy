const mysql = require('mysql');
const Promise = require('bluebird');
const _ = require('lodash');
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

function Mysql(config) {
    var pool = mysql.createPool(config);

    return {
        mysql: pool,
        print: function(sql, data) {
            if (config.showSQL)
                console.log("QUERY: " + sql + " | PARAMS: " + JSON.stringify(data));
        },
        runQuery: function(sql, data) {
            return new Promise((resolve, reject) => {
                pool.getConnection((err, conn) => {
                    if(err)
                      return reject(err);

                    this.print(sql, data);

                    conn.query(sql, data, (err, rows) => {
                        if(err)
                            return reject(err);

                        conn.release();
                        return resolve(rows);
                    });
                });
            });
        },
        getData: function() {
            var args = arguments;

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

            return this.runQuery(sql, args[3] || []);
        },
        get: function() {
            var args = arguments;

            return this.getData(args[0],args[1],args[2],args[3],args[4],args[5],1)
                .then(res => {
                    return Promise.resolve(res[0] || null)
                })
        },
        insert: function() {
            var args = arguments;

            var sql = "INSERT ";
            if(args[2]) sql += 'IGNORE ';
            sql += "INTO " + args[0] + " SET ? ";

            return this.runQuery(sql, args[1]);
        },
        insertMultiple: function() {
            var args = arguments;

            var sql = "INSERT ";
            if(args[2]) sql += 'IGNORE ';
            sql += "INTO " + args[0] + " VALUES ? ";

            return this.runQuery(sql, [args[1]]);
        },
        update: function(where, values, cond, params) {
            var args = arguments;

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

            return this.runQuery(sql, arr);
        },
        delete: function(where, cond, params) {
            var args = arguments;
            var sql = "DELETE FROM " + args[0] + " WHERE " + (args[1] || '1=1');

            if (!args[2] instanceof Array)
                args[2] = [args[2]];

            this.runQuery(sql, args[2]);
        },
        sql: function(sql, params) {
            return this.runQuery(sql, params);
        }
    };
}

module.exports = Mysql;