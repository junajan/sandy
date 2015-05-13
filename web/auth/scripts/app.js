'use strict';

var Sandy = angular.module("sandy", ['angularModalService', 'ngRoute', 'ngResource', 'yaru22.angular-timeago'])
    .config([
        '$httpProvider', '$locationProvider', '$routeProvider',
        function($httpProvider, $locationProvider, $routeProvider) {

            // configure html5 like urls (without # character)
            $locationProvider.html5Mode(true);

            // what will we send on api
            $httpProvider.defaults.headers.common["Content-type"] = "application/json";
            $httpProvider.interceptors.push('LoginInterceptor');

            delete $httpProvider.defaults.headers.common['X-Requested-With'];
        }
    ])
    .config([
        '$routeProvider',
        function($routeProvider) {
            var viewFolder = "/app/views/";

            $routeProvider.when("/", {
                templateUrl: viewFolder+"Dashboard.html",
                controller: "Dashboard",
                title: "Dashboard"
            })
            .when("/settings", {
                templateUrl: viewFolder+"Settings.html",
                controller: "Settings",
                title: "Settings"
            })
            .when("/time-schedule", {
                templateUrl: viewFolder+"TimeSchedule.html",
                controller: "TimeSchedule",
                title: "Time Schedule"
            })
            .when("/user-settings", {
                templateUrl: viewFolder+"UserSettings.html",
                controller: "UserSettings",
                title: "User Settings"
            })
            .when("/history", {
                templateUrl: viewFolder+"History.html",
                controller: "History",
                title: "History"
            })
            .when("/tickers", {
                templateUrl: viewFolder+"Tickers.html",
                controller: "Tickers",
                title: "Tickers"
            })
            .when("/actual-info", {
                templateUrl: viewFolder+"ActualInfo.html",
                controller: "ActualInfo",
                title: "Actual Info"
            })
            .otherwise({
                templateUrl: viewFolder+"/Error404.html",
                controller: "Error404",
                title: "Error 404"
            });
        }
    ])
    .run([
        '$rootScope',
        function($rootScope) {
            $rootScope.inited = false;
        }
    ]);