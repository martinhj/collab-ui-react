(function () {
  'use strict';

  angular.module('core.trial')
    .controller('TrialAddCtrl', TrialAddCtrl);

  /* @ngInject */
  function TrialAddCtrl($q, $scope, $state, $translate, $window, Authinfo, Config, EmailService, FeatureToggleService, HuronCustomer, Notification, TrialService, ValidationService) {
    var vm = this;
    var _roomSystemDefaultQuantity = 5;

    vm.trialData = TrialService.getData();

    vm.nameError = false;
    vm.emailError = false;
    vm.customerOrgId = undefined;
    vm.showRoomSystems = false;
    vm.details = vm.trialData.details;
    vm.messageTrial = vm.trialData.trials.messageTrial;
    vm.meetingTrial = vm.trialData.trials.meetingTrial;
    vm.callTrial = vm.trialData.trials.callTrial;
    vm.roomSystemTrial = vm.trialData.trials.roomSystemTrial;
    vm.trialStates = [{
      'name': 'trialAdd.meeting',
      'trials': [vm.meetingTrial],
      'enabled': true,
    }, {
      'name': 'trialAdd.call',
      'trials': [vm.callTrial, vm.roomSystemTrial],
      'enabled': true,
    }, {
      'name': 'trialAdd.addNumbers',
      'trials': [vm.callTrial],
      'enabled': true,
    }];
    // Navigate trial modal in this order
    // TODO: addNumbers must be last page for now due to controller destroy.
    // This page "should" be refactored or become obsolete with PSTN
    vm.navOrder = ['trialAdd.info', 'trialAdd.meeting', 'trialAdd.call', 'trialAdd.addNumbers'];
    vm.navStates = ['trialAdd.info'];
    vm.showMeeting = false;
    vm.canEditMessage = true;
    vm.canEditMeeting = true;
    vm.startTrial = startTrial;

    vm.custInfoFields = [{
      model: vm.details,
      key: 'customerName',
      type: 'input',
      templateOptions: {
        label: $translate.instant('partnerHomePage.customerName'),
        labelClass: 'columns medium-4',
        inputClass: 'columns medium-8',
        type: 'text',
        required: true,
        maxlength: 50,
      },
    }, {
      model: vm.details,
      key: 'customerEmail',
      type: 'input',
      className: 'last-field',
      templateOptions: {
        label: $translate.instant('partnerHomePage.customerEmail'),
        labelClass: 'columns medium-4',
        inputClass: 'columns medium-8',
        type: 'email',
        required: true,
      },
    }];

    vm.individualServices = [{
      model: vm.details,
      key: 'licenseCount',
      type: 'input',
      className: 'columns medium-12 license-count',
      templateOptions: {
        label: $translate.instant('siteList.licenseCount'),
        labelClass: 'columns medium-6',
        inputClass: 'columns medium-3',
        type: 'number',
        required: true,
      },
      validators: {
        count: {
          expression: function ($viewValue, $modelValue) {
            return ValidationService.trialLicenseCount($viewValue, $modelValue);
          },
          message: function () {
            return $translate.instant('partnerHomePage.invalidTrialLicenseCount');
          },
        },
      },
    }, {
      // Message Trial
      model: vm.messageTrial,
      key: 'enabled',
      type: 'checkbox',
      className: 'columns medium-12',
      templateOptions: {
        label: $translate.instant('trials.messageAndMeeting'),
        id: 'squaredTrial',
        class: 'columns medium-12 checkbox-group',
      },
      expressionProperties: {
        'templateOptions.disabled': function () {
          return !vm.canEditMessage;
        },
      },
    }, {
      // Meeting Trial
      model: vm.meetingTrial,
      key: 'enabled',
      type: 'checkbox',
      className: 'columns medium-12 checkbox-group',
      templateOptions: {
        label: $translate.instant('trials.meeting'),
        id: 'meetingTrial',
        class: 'columns medium-12',
      },
      hideExpression: function () {
        return !vm.showMeeting;
      },
      expressionProperties: {
        'templateOptions.disabled': function () {
          return !vm.canEditMeeting;
        },
      },
    }, {
      // Call Trial
      model: vm.callTrial,
      key: 'enabled',
      type: 'checkbox',
      className: 'columns medium-12 checkbox-group',
      templateOptions: {
        label: $translate.instant('trials.call'),
        id: 'squaredUCTrial',
        class: 'columns medium-12',
      },
      hideExpression: function () {
        return !vm.hasCallEntitlement();
      }
    }];

    // Room Systems Trial
    vm.roomSystemFields = [{
      model: vm.roomSystemTrial,
      key: 'enabled',
      type: 'checkbox',
      className: "columns medium-6",
      templateOptions: {
        label: $translate.instant('trials.roomSystem'),
        id: 'trialRoomSystem',
        class: 'columns medium-12',
      },
      watcher: {
        listener: function (field, newValue, oldValue, scope, stopWatching) {
          if (newValue !== oldValue) {
            field.model.details.quantity = newValue ? _roomSystemDefaultQuantity : 0;
          }
        }
      }
    }, {
      model: vm.roomSystemTrial.details,
      key: 'quantity',
      type: 'input',
      className: "columns medium-6",
      templateOptions: {
        id: 'trialRoomSystemsAmount',
        inputClass: 'columns medium-10',
        secondaryLabel: $translate.instant('trials.licenses'),
        type: 'number'
      },
      expressionProperties: {
        'templateOptions.required': function () {
          return vm.roomSystemTrial.enabled;
        },
        'templateOptions.disabled': function () {
          return !vm.roomSystemTrial.enabled;
        },
      },
      validators: {
        quantity: {
          expression: function ($viewValue, $modelValue) {
            return !vm.roomSystemTrial.enabled || ValidationService.trialRoomSystemQuantity($viewValue, $modelValue);
          },
          message: function () {
            return $translate.instant('partnerHomePage.invalidTrialRoomSystemQuantity');
          }
        }
      }
    }];

    vm.trialTermsFields = [{
      model: vm.details,
      key: 'licenseDuration',
      type: 'select',
      defaultValue: 30,
      templateOptions: {
        labelfield: 'label',
        required: true,
        label: $translate.instant('partnerHomePage.duration'),
        secondaryLabel: $translate.instant('partnerHomePage.durationHelp'),
        labelClass: 'columns medium-4',
        inputClass: 'columns medium-4',
        options: [30, 60, 90],
      },
    }];

    vm.hasCallEntitlement = Authinfo.isSquaredUC;
    vm.hasTrial = hasTrial;
    vm.hasNextStep = hasNextStep;
    vm.previousStep = previousStep;
    vm.nextStep = nextStep;
    vm.finishSetup = finishSetup;
    vm.closeDialogBox = closeDialogBox;
    vm.launchCustomerPortal = launchCustomerPortal;

    init();

    ///////////////////////

    function init() {
      $q.all([
        FeatureToggleService.supports(FeatureToggleService.features.atlasCloudberryTrials),
        FeatureToggleService.supports(FeatureToggleService.features.atlasWebexTrials),
        FeatureToggleService.supportsPstnSetup(),
        FeatureToggleService.supports(FeatureToggleService.features.atlasDeviceTrials)
      ]).then(function (results) {
        vm.showRoomSystems = results[0];
        vm.roomSystemTrial.enabled = results[0];
        vm.meetingTrial.enabled = results[1];
        vm.supportsPstnSetup = results[2];
        vm.callTrial.enabled = vm.hasCallEntitlement();
        vm.messageTrial.enabled = true;
        if (vm.meetingTrial.enabled) {
          vm.showMeeting = true;
        }

        var devicesModal = _.find(vm.trialStates, {
          'name': 'trialAdd.call'
        });
        var meetingModal = _.find(vm.trialStates, {
          'name': 'trialAdd.meeting'
        });
        var addNumbersModal = _.find(vm.trialStates, {
          'name': 'trialAdd.addNumbers'
        });

        devicesModal.enabled = results[3] && results[1];
        meetingModal.enabled = results[1];
        addNumbersModal.enabled = !vm.supportsPstnSetup;

      }).finally(function () {
        $scope.$watch(function () {
          return vm.trialData.trials;
        }, function (newVal, oldVal) {
          if (newVal !== oldVal) {
            toggleTrial();
          }
        }, true);

        // Capture modal close and clear service
        if ($state.modal) {
          $state.modal.result.finally(function () {
            TrialService.reset();
          });
        }

        vm.roomSystemFields[1].model.quantity = vm.roomSystemTrial.enabled ? _roomSystemDefaultQuantity : 0;
        toggleTrial();
      });
    }

    function toggleTrial() {
      if (vm.callTrial.enabled || vm.roomSystemTrial.enabled) {
        vm.canEditMessage = false;
        vm.canEditMeeting = false;
        if (vm.showMeeting) {
          vm.meetingTrial.enabled = true;
        }
        vm.messageTrial.enabled = true;
      } else {
        vm.canEditMessage = true;
        vm.canEditMeeting = true;
      }
      addRemoveStates();
    }

    function addRemoveStates() {
      _.forEach(vm.trialStates, function (state) {
        if (!state.enabled || _.every(state.trials, {
            enabled: false
          })) {
          removeNavState(state.name);
        } else {
          addNavState(state.name);
        }
      });
    }

    function hasTrial() {
      return _.some(vm.trialData.trials, {
        enabled: true
      });
    }

    function hasNextStep() {
      return !_.isUndefined(getNextState());
    }

    function finishSetup() {
      $state.go('trialAdd.finishSetup');
    }

    function previousStep() {
      var state = getBackState();
      if (state) {
        $state.go(state);
      }
    }

    function getBackState() {
      return _.chain(vm.navStates)
        .indexOf($state.current.name)
        .thru(function (index) {
          return _.slice(vm.navStates, 0, index);
        })
        .findLast(function (state) {
          return !_.isUndefined(state);
        })
        .value();
    }

    function nextStep(callback) {
      if (!hasNextStep()) {
        return startTrial(callback);
      } else {
        return $state.go(getNextState());
      }
    }

    function getNextState() {
      return _.chain(vm.navStates)
        .indexOf($state.current.name)
        .thru(function (index) {
          return _.slice(vm.navStates, index + 1);
        })
        .find(function (state) {
          return !_.isUndefined(state);
        })
        .value();
    }

    function addNavState(state) {
      vm.navStates[_.indexOf(vm.navOrder, state)] = state;
    }

    function removeNavState(state) {
      // just null out the position in array
      delete vm.navStates[_.indexOf(vm.navStates, state)];
    }

    function startTrial(addNumbersCallback) {
      vm.nameError = false;
      vm.emailError = false;
      vm.startTrialButtonLoad = true;

      return TrialService.startTrial()
        .catch(function (response) {
          vm.startTrialButtonLoad = false;
          Notification.notify([response.data.message], 'error');
          if ((response.data.message).indexOf('Org') > -1) {
            vm.nameError = true;
          } else if ((response.data.message).indexOf('Admin User') > -1) {
            vm.emailError = true;
          }
          return $q.reject(response);
        })
        .then(function (response) {
          vm.customerOrgId = response.data.customerOrgId;
          return EmailService.emailNotifyTrialCustomer(vm.details.customerEmail,
              vm.details.licenseDuration, vm.customerOrgId)
            .catch(function (response) {
              Notification.notify([$translate.instant('didManageModal.emailFailText')], 'error');
            })
            .then(function () {
              if (vm.callTrial.enabled) {
                return HuronCustomer.create(vm.customerOrgId, response.data.customerName, response.data.customerEmail)
                  .catch(function (response) {
                    vm.startTrialButtonLoad = false;
                    Notification.errorResponse(response, 'trialModal.squareducError');
                    return $q.reject(response);
                  });
              }
            });
        })
        .then(function () {
          var successMessage = [$translate.instant('trialModal.addSuccess', {
            customerName: vm.details.customerName
          })];
          Notification.notify(successMessage, 'success');

          if (addNumbersCallback) {
            return addNumbersCallback(vm.customerOrgId)
              .catch(_.noop); //don't throw an error
          }
        })
        .then(function () {
          vm.startTrialButtonLoad = false;
          vm.finishSetup();
          return {
            'customerOrgId': vm.customerOrgId
          };
        });
    }

    function closeDialogBox() {
      $state.modal.close();
    }

    function launchCustomerPortal() {
      if (angular.isDefined($scope.trial)) {
        $window.open($state.href('login_swap', {
          'customerOrgId': vm.customerOrgId,
          'customerOrgName': vm.details.customerName
        }));
        $state.modal.close();
      }
    }
  }
})();
