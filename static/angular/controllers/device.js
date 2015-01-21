(function () {
    'use strict';

    var app = angular.module('is-occupied');

    app.controller("DeviceController", function ($scope, $routeParams, SharedService) {
        var vm = $scope;
        var deviceId = $routeParams.id;
        vm.device = SharedService.devices[deviceId];
    });

})();