(function () {
    'use strict';

    var app = angular.module('is-occupied');

    app.factory("DeviceService", function ($http, socket) {

            return {
                all: all,
                get: get,
                addDeviceEmailSubscription: addDeviceEmailSubscription,
                subscribe: subscribe
            };

            function all() {
                return $http.get('/api/devices');
            }

            function get(deviceId) {
                if (!deviceId) {
                    throw new Error('device id cannot be null')
                }

                return $http.get('/api/devices/' + deviceId);
            }

            function subscribe(scope, callback) {
                socket.on('devices:update', callback).bindTo(scope);
            }

            function addDeviceEmailSubscription(deviceId, email) {
                var json = angular.toJson({
                    email: email
                });

                return $http.post('/api/devices/' + deviceId + '/subscribe/', json);
            }
        }
    );

})();