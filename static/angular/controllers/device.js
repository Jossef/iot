(function () {
    'use strict';

    var app = angular.module('is-occupied');

    app.controller("DeviceController", function ($scope, $routeParams, SharedService, DeviceService) {
        var vm = $scope;
        var deviceId = $routeParams.id;
        vm.device = SharedService.devices[deviceId];

        vm.subscribeEmail = '';
        vm.subscribeEmailToDevice = function () {

            var email = vm.subscribeEmail;
            var mailValid = SharedService.validateEmail(email);

            if (!mailValid) {
                SharedService.showError('invalid email address');
                return;
            }

            DeviceService.addDeviceEmailSubscription(deviceId, email)
                .success(function () {
                    SharedService.showNotification('registered ' + email + ' with ' + deviceId);
                    vm.subscribeEmail = '';
                });
        }
    });

})();