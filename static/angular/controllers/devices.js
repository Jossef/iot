(function () {
    'use strict';

    var app = angular.module('is-occupied');

    app.controller("DevicesController", function ($scope, socket, DeviceService, SharedService) {
        var vm = $scope;

        vm.messages = [];
        vm.devices = SharedService.devices;


    });

})();