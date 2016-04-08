(function () {
  'use strict';

  angular.module('Huron')
    .controller('ExternalNumberDetailCtrl', ExternalNumberDetail);

  /* @ngInject */
  function ExternalNumberDetail($stateParams, $translate, $q, ExternalNumberService, ModalService, PstnSetupService, Notification, TelephoneNumberService, DialPlanService, $interval, $scope) {
    var vm = this;
    vm.currentCustomer = $stateParams.currentCustomer;

    // Initialize arrays from service
    getNumbers();

    // Initialize filtered arrays for translation directives
    vm.filteredAllNumbers = [];
    vm.filteredPendingNumbers = [];
    vm.filteredUnassignedNumbers = [];

    vm.showPstnSetup = false;
    vm.loading = false;

    vm.allText = $translate.instant('common.all');
    vm.pendingText = $translate.instant('common.pending');
    vm.unassignedText = $translate.instant('common.unassigned');

    vm.deleteNumber = deleteNumber;
    vm.listPhoneNumbers = listPhoneNumbers;

    vm.isNumberValid = TelephoneNumberService.validateDID;

    init();

    function init() {
      vm.loading = true;
      setCountryCode()
        .then(function () {
          listPhoneNumbers();
          var interval = $interval(listPhoneNumbers, 10000);
          $scope.$on('$destroy', function () {
            $interval.cancel(interval);
          });
        });

      ExternalNumberService.isTerminusCustomer(vm.currentCustomer.customerOrgId)
        .then(function (response) {
          vm.showPstnSetup = response;
        }).finally(function () {
          vm.loading = false;
        });
    }

    function listPhoneNumbers() {
      if (vm.currentCustomer && vm.currentCustomer.customerOrgId) {
        vm.refresh = true;
        return ExternalNumberService.refreshNumbers(vm.currentCustomer.customerOrgId)
          .catch(function (response) {
            Notification.errorResponse(response, 'externalNumberPanel.listError');
          })
          .finally(getNumbers);
      } else {
        ExternalNumberService.clearNumbers();
        getNumbers();
      }
    }

    function setCountryCode() {
      return DialPlanService.getCustomerDialPlanCountryCode(vm.currentCustomer.customerOrgId)
        .then(TelephoneNumberService.setCountryCode)
        .catch(function (response) {
          Notification.errorResponse(response, 'serviceSetupModal.customerDialPlanDetailsGetError');
        });
    }

    function deleteNumber(number) {
      ModalService.open({
        title: $translate.instant('externalNumberPanel.deleteNumber'),
        message: $translate.instant('externalNumberPanel.deleteConfirmation', {
          pattern: number.label
        }) + '<br>' + $translate.instant('externalNumberPanel.deleteWarning'),
        close: $translate.instant('common.yes'),
        dismiss: $translate.instant('common.no'),
        type: 'negative'
      }).result.then(function () {
        return ExternalNumberService.deleteNumber(vm.currentCustomer.customerOrgId, number)
          .then(function () {
            Notification.success('notifications.successDelete', {
              item: number.pattern
            });
            _.remove(vm.allNumbers, number);
            ExternalNumberService.setAllNumbers(vm.allNumbers);
            getNumbers();
          }).catch(function (response) {
            Notification.errorResponse(response, 'notifications.errorDelete', {
              item: number.pattern
            });
          });
      });
    }

    function getNumbers() {
      vm.allNumbers = ExternalNumberService.getAllNumbers();
      vm.pendingNumbers = ExternalNumberService.getPendingNumbers();
      vm.unassignedNumbers = ExternalNumberService.getUnassignedNumbersWithoutPending();
      vm.refresh = false;
    }
  }
})();
