(function () {
  'use strict';

  angular
    .module('uc.device')
    .controller('DeviceDetailCtrl', DeviceDetailCtrl);

  /* @ngInject */
  function DeviceDetailCtrl($rootScope, $scope, $translate, $modal, $state, Log, DeviceService, Notification) {
    var vm = this;
    vm.device = {};
    vm.title = '';
    vm.deviceIcon = '';
    vm.save = save;
    vm.deactivate = deactivate;

    activate();
    ////////////

    function activate() {
      vm.device = DeviceService.getCurrentDevice();
      vm.title = vm.device.model;
      vm.deviceIcon = (vm.device.model.trim().replace(/ /g, '_') + '.svg').toLowerCase();
    }

    function save() {
      DeviceService.updateDevice(vm.device)
        .then(function (response) {
          Notification.notify([$translate.instant('deviceDetailPage.success')], 'success');
        })
        .catch(function (response) {
          Log.debug('updateDevice failed.  Status: ' + response.status + ' Response: ' + response.data);
          Notification.notify([$translate.instant('deviceDetailPage.error')], 'error');
        });
    }

    function deactivate() {
      var modalInstance = $modal.open({
        templateUrl: 'modules/huron/device/deactivateDeviceModal.tpl.html'
      });

      modalInstance.result.then(function (reason) {
        DeviceService.deleteDevice(vm.device)
          .then(function (response) {
            $rootScope.$broadcast("deviceDeactivated");
            Notification.notify([$translate.instant('deviceDetailPage.success')], 'success');
            $state.go('users.list.preview');
          })
          .catch(function (response) {
            Log.debug('deleteDevice failed.  Status: ' + response.status + ' Response: ' + response.data);
            Notification.notify([$translate.instant('deviceDetailPage.error')], 'error');
          });
      });
    }

  }
})();
