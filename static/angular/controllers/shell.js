(function () {
    'use strict';

    var app = angular.module('is-occupied');

    app.controller("ShellController", function ($scope, SharedService, DeviceService) {
            var vm = $scope;
            vm.devices = SharedService.devices;

            $scope.$watchCollection('devices', function(newValue){
                vm.devicesCount = 0;
                if (newValue)
                {
                    vm.devicesCount = Object.keys(newValue).length;
                }
            }, true);

            DeviceService.all().success(function (devices) {

                if (!devices) {
                    return;
                }

                angular.forEach(devices, function (device) {
                    vm.devices[device._id] = device;
                });

            });

            DeviceService.subscribe(vm, function (device) {

                if (!device) {
                    return;
                }

                var cachedDevice = vm.devices[device._id];

                if (!cachedDevice) {

                    cachedDevice = device;
                }

                angular.extend(cachedDevice, device);
                vm.devices[device._id] = cachedDevice;

                if (device.occupied == false)
                {
                    SharedService.playNotificationSound();
                    SharedService.showNotification(device._id + ' unoccupied');
                }
            });

            // ------------------
            // Experiments :

            vm.labels = ['2006', '2007', '2008', '2009', '2010', '2011', '2012'];
            vm.series = ['Series A'];

            vm.data = [
                [65, 59, 80, 81, 56, 55, 40]
            ];

            vm.playSound = function () {
                SharedService.playNotificationSound();
            }

        }
    );

})();