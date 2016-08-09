(function () {
  'use strict';

  angular.module('Core')
    .controller('ChooseSharedSpaceCtrl', ChooseSharedSpaceCtrl);
  /* @ngInject */
  function ChooseSharedSpaceCtrl(CsdmCodeService, CsdmPlaceService, XhrNotificationService, $stateParams, $state, $translate, Authinfo) {
    var vm = this;
    vm.wizardData = $stateParams.wizard.state().data;

    vm.onlyNew = function () {
      return vm.wizardData.function == 'addPlace' || vm.wizardData.deviceType == 'cloudberry';
    };

    vm.isNewCollapsed = !vm.onlyNew();
    vm.isExistingCollapsed = true;
    vm.selected = null;
    vm.radioSelect = null;
    vm.isLoading = false;
    vm.rooms = undefined;
    vm.hasRooms = undefined;

    function init() {
      loadList();
    }

    init();

    vm.localizedCreateInstructions = function () {
      if (!vm.wizardData.showPlaces) {
        return $translate.instant('addDeviceWizard.chooseSharedSpace.deviceInstalledInstructions');
      }
      if (vm.onlyNew()) {
        return $translate.instant('addDeviceWizard.chooseSharedSpace.newPlaceOnlyInstructions');
      }
      return $translate.instant('addDeviceWizard.chooseSharedSpace.newPlaceInstructions');
    };

    function loadList() {
      if (vm.wizardData.showPlaces) {
        var filteredList = _(CsdmPlaceService.getPlacesList()).filter(function (place) {
          return (vm.wizardData.deviceType == 'cloudberry' && place.type == 'cloudberry' && _.isEmpty(place.devices)) || (vm.wizardData.deviceType == 'huron' && place.type == 'huron');
        }).sortBy('displayName').value();
        vm.hasRooms = filteredList.length > 0;
        vm.rooms = filteredList;
      }
    }

    vm.selectPlace = function ($item) {
      vm.place = $item;
      vm.deviceName = $item.displayName;
      vm.selected = $item.displayName;
    };

    vm.existing = function () {
      vm.radioSelect = "existing";
      vm.toggle();
    };

    vm.create = function () {
      vm.radioSelect = "create";
      vm.toggle();
    };

    vm.toggle = function () {
      vm.isNewCollapsed = vm.radioSelect == "existing";
      vm.isExistingCollapsed = vm.radioSelect == "create";
    };
    var minlength = 3;
    var maxlength = 64;
    vm.message = {
      required: $translate.instant('common.invalidRequired'),
      min: $translate.instant('common.invalidMinLength', {
        'min': minlength
      }),
      max: $translate.instant('common.invalidMaxLength', {
        'max': maxlength
      })
    };
    vm.isNameValid = function () {
      if (vm.place) {
        return true;
      } // hack;
      return vm.deviceName && vm.deviceName.length >= minlength && vm.deviceName.length < maxlength;
    };
    vm.next = function () {
      vm.isLoading = true;
      var nextOption = vm.wizardData.deviceType;
      if (nextOption == 'huron') {
        if (vm.wizardData.function == 'addPlace') {
          nextOption += '_' + 'create';
        } else {
          nextOption += '_' + vm.radioSelect;
        }
      }

      function success(code) {
        vm.isLoading = false;
        $stateParams.wizard.next({
          deviceName: vm.deviceName,
          code: code,
          // expiryTime: code.expiryTime,
          cisUuid: Authinfo.getUserId(),
          userName: Authinfo.getUserName(),
          displayName: Authinfo.getUserName(),
          organizationId: Authinfo.getOrgId()
        }, nextOption);
      }

      function error(err) {
        XhrNotificationService.notify(err);
        vm.isLoading = false;
      }

      if (vm.place) {
        CsdmCodeService
          .createCodeForExisting(vm.place.cisUuid)
          .then(success, error);
      } else {
        if (vm.wizardData.deviceType === "cloudberry") {
          CsdmPlaceService.createCsdmPlace(vm.deviceName, vm.wizardData.deviceType).then(function (place) {
            vm.place = place;
            CsdmCodeService
              .createCodeForExisting(place.cisUuid)
              .then(success, error);
          }, error);
        } else { //New Place
          success();
        }
      }
    };

    vm.back = function () {
      $stateParams.wizard.back();
    };

    vm.clickUsers = function () {
      $state.go('users.list');
    };
  }
})();
