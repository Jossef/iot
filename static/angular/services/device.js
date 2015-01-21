(function () {
    'use strict';

    var app = angular.module('is-occupied');

    app.factory("DeviceService", function ($http, socket) {

            return {
                getAll: getAll,
                getDevice: getDevice,
                getDeviceHistory: getDeviceHistory,
                getAllHistory: getAllHistory,
                addDeviceEmailSubscription: addDeviceEmailSubscription,
                subscribe: subscribe
            };

            function getAll() {
                return $http.get('/api/devices');
            }

            function getDevice(deviceId) {
                if (!deviceId) {
                    throw new Error('device id cannot be null')
                }

                return $http.get('/api/devices/' + deviceId);
            }

            function getAllHistory() {
                return $http.get('/api/devices/history');
            }

            function getDeviceHistory(deviceId) {
                if (!deviceId) {
                    throw new Error('device id cannot be null')
                }

                return $http.get('/api/devices/' + deviceId + '/history');
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