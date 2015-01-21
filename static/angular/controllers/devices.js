(function () {
    'use strict';

    var app = angular.module('is-occupied');

    app.controller("DevicesController", function ($scope, SharedService) {
        var vm = $scope;
        vm.devices = SharedService.devices;
        vm.common = SharedService;




        vm.getDeviceOccupation = function(device)
        {
            return (new Date().getTime() - new Date(device.lastActive).getTime())
        };

    });

})();