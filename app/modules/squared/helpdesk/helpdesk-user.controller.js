(function () {
  'use strict';

  /* @ngInject */
  function HelpdeskUserController($stateParams, HelpdeskService, XhrNotificationService, USSService2, HelpdeskCardsUserService, Config, LicenseService, HelpdeskHuronService, HelpdeskLogService, Authinfo, $window, $modal, WindowLocation, FeatureToggleService) {
    $('body').css('background', 'white');
    var vm = this;
    if ($stateParams.user) {
      vm.userId = $stateParams.user.id;
      vm.orgId = $stateParams.user.organization.id;
      vm.org = $stateParams.user.organization;
    } else {
      vm.userId = $stateParams.id;
      vm.orgId = $stateParams.orgId;
      vm.org = {
        id: $stateParams.orgId
      };
    }
    vm.resendInviteEmail = resendInviteEmail;
    vm.user = $stateParams.user;
    vm.resendInviteEnabled = false;
    vm.messageCard = {};
    vm.meetingCard = {};
    vm.callCard = {};
    vm.hybridServicesCard = {};
    vm.keyPressHandler = keyPressHandler;
    vm.sendCode = sendCode;
    vm.downloadLog = downloadLog;
    vm.isAuthorizedForLog = isAuthorizedForLog;
    vm.openExtendedInformation = openExtendedInformation;
    vm.supportsExtendedInformation = false;

    FeatureToggleService.supports(FeatureToggleService.features.helpdeskExt).then(function (result) {
      vm.supportsExtendedInformation = result;
    });

    HelpdeskService.getUser(vm.orgId, vm.userId).then(initUserView, XhrNotificationService.notify);

    function resendInviteEmail() {
      HelpdeskService.resendInviteEmail(vm.user.displayName, vm.user.userName).then(angular.noop, XhrNotificationService.notify);
    }

    function sendCode() {
      HelpdeskService.sendVerificationCode(vm.user.displayName, vm.user.userName).then(function (code) {
        vm.verificationCode = code;
        vm.sendingVerificationCode = false;
      }, XhrNotificationService.notify);
    }

    function openExtendedInformation(title, message) {
      if (vm.supportsExtendedInformation) {
        $modal.open({
          templateUrl: "modules/squared/helpdesk/helpdesk-extended-information.html",
          controller: 'HelpdeskExtendedInformationCtrl as modal',
          resolve: {
            title: function () {
              return title;
            },
            message: function () {
              return message;
            }
          }
        });
      }
    }

    function initUserView(user) {
      vm.user = user;
      vm.userStringified = JSON.stringify(user, null, 4);
      vm.resendInviteEnabled = _.includes(user.statuses, 'helpdesk.userStatuses.pending');
      vm.messageCard = HelpdeskCardsUserService.getMessageCardForUser(user);
      vm.meetingCard = HelpdeskCardsUserService.getMeetingCardForUser(user);
      vm.callCard = HelpdeskCardsUserService.getCallCardForUser(user);
      vm.hybridServicesCard = HelpdeskCardsUserService.getHybridServicesCardForUser(user);

      if (vm.hybridServicesCard.entitled) {
        HelpdeskService.getHybridStatusesForUser(vm.userId, vm.orgId).then(function (statuses) {
          _.each(statuses, function (status) {
            status.collapsedState = USSService2.decorateWithStatus(status);
            switch (status.serviceId) {
            case 'squared-fusion-cal':
              vm.hybridServicesCard.cal.status = status;
              break;
            case 'squared-fusion-uc':
              vm.hybridServicesCard.uc.status = status;
              break;
            case 'squared-fusion-ec':
              vm.hybridServicesCard.ec.status = status;
              break;
            }
          });
        }, XhrNotificationService.notify);
      }

      if (!vm.org.displayName && vm.org.id !== Config.consumerOrgId) {
        // Only if there is no displayName. If set, the org name has already been read (on the search page)
        HelpdeskService.getOrgDisplayName(vm.orgId).then(function (displayName) {
          vm.org.displayName = displayName;
        }, XhrNotificationService.notify);
      }

      if (LicenseService.userIsEntitledTo(user, Config.entitlements.huron)) {
        HelpdeskHuronService.getDevices(vm.userId, vm.orgId).then(function (devices) {
          vm.huronDevices = devices;
        }, handleHuronError);
        HelpdeskHuronService.getUserNumbers(vm.userId, vm.orgId).then(function (numbers) {
          vm.callCard.huronNumbers = numbers;
        }, handleHuronError);
      }

      if (isAuthorizedForLog()) {
        HelpdeskLogService.searchForLastPushedLog(vm.userId).then(function (log) {
          vm.lastPushedLog = log;
        }, angular.noop);
      }

      angular.element(".helpdesk-details").focus();
    }

    function isAuthorizedForLog() {
      return (Authinfo.isCisco() && (Authinfo.isSupportUser() || Authinfo.isAdmin() || Authinfo.isAppAdmin()));
    }

    function downloadLog(filename) {
      HelpdeskLogService.downloadLog(filename).then(function (tempURL) {
        WindowLocation.set(tempURL);
      });
    }

    function handleHuronError(err) {
      if (err.status !== 404) {
        XhrNotificationService.notify(err);
      }
    }

    function keyPressHandler(event) {
      if (event.keyCode === 27) { // Esc
        $window.history.back();
      }
    }
  }

  /* @ngInject */
  function HelpdeskExtendedInformationCtrl(title, message) {
    var vm = this;
    vm.message = message;
    vm.title = title;
  }

  angular
    .module('Squared')
    .controller('HelpdeskUserController', HelpdeskUserController)
    .controller('HelpdeskExtendedInformationCtrl', HelpdeskExtendedInformationCtrl);
}());
