(function ()
{
    'use strict';

    var app = angular.module('is-occupied', [

        // Builtin
        'ngAnimate',

        // External
        'ui.router',
        'ui.bootstrap',
        'chart.js',
        'ngAudio',
        'angular-growl',

        'socket-io'
    ]);

    // ......................................................
    // SPA URL Route states
    app.config(
        function ($stateProvider, $urlRouterProvider)
        {
            $urlRouterProvider.otherwise("/");
            $stateProvider
                .state('default', {
                    url: "/",
                    templateUrl: "/static/views/main.html",
                    controller: 'MainController'
                })
                .state('devices', {
                    url: "/devices",
                    templateUrl: "/static/views/devices.html",
                    controller: 'DevicesController'
                })
        });

    // ......................................................
    // Promises Fix
    app.config(
        function ($provide)
        {
            $provide.decorator('$q', function ($delegate)
            {
                var defer = $delegate.defer;
                $delegate.defer = function ()
                {
                    var deferred = defer();
                    deferred.promise.success = function (fn)
                    {
                        deferred.promise.then(fn);
                        return deferred.promise;
                    };
                    deferred.promise.error = function (fn)
                    {
                        deferred.promise.then(null, fn);
                        return deferred.promise;
                    };
                    return deferred;
                };
                return $delegate;
            });
        });


    // ......................................................
    // growl
    app.config(
        function (growlProvider)
        {
            growlProvider.globalReversedOrder(true);
            growlProvider.globalTimeToLive(2000);
            growlProvider.globalPosition('bottom-right');
            growlProvider.globalDisableIcons(true);
            growlProvider.globalDisableCloseButton(true);

        });


})();