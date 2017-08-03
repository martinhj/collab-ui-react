require('./_setup-wizard.scss');

(function () {
  'use strict';

  angular.module('Core')
    .controller('SetupWizardCtrl', SetupWizardCtrl);

  function SetupWizardCtrl($q, $scope, $state, $stateParams, $timeout, Authinfo, Config, FeatureToggleService, Orgservice, SetupWizardService, Utils, Notification) {
    var isFirstTimeSetup = _.get($state, 'current.data.firstTimeSetup', false);
    var shouldRemoveSSOSteps = false;
    var isSharedDevicesOnlyLicense = false;
    var shouldShowMeetingsTab = false;
    var hasPendingCallLicenses = false;
    var hasPendingLicenses = false;
    var supportsAtlasPMRonM2 = false;
    var supportsHI1484 = false;
    $scope.tabs = [];
    $scope.isTelstraCsbEnabled = false;
    $scope.isCSB = Authinfo.isCSB();
    $scope.isCustomerPresent = SetupWizardService.isCustomerPresent();

    if (Authinfo.isCustomerAdmin()) {
      initToggles().finally(init);
    }

    function initToggles() {
      if (isFirstTimeSetup) {
        shouldRemoveSSOSteps = true;
      }

      var hI1484Promise = FeatureToggleService.supports(FeatureToggleService.features.hI1484)
        .then(function (_supportsHI1484) {
          supportsHI1484 = _supportsHI1484;
        });

      var adminOrgUsagePromise = Orgservice.getAdminOrgUsage()
        .then(function (subscriptions) {
          var licenseTypes = Utils.getDeepKeyValues(subscriptions, 'licenseType');
          isSharedDevicesOnlyLicense = _.without(licenseTypes, Config.licenseTypes.SHARED_DEVICES).length === 0;
        })
        .catch(_.noop);

      var atlasPMRonM2Promise = FeatureToggleService.supports(FeatureToggleService.features.atlasPMRonM2)
        .then(function (_supportsAtlasPMRonM2) {
          supportsAtlasPMRonM2 = _supportsAtlasPMRonM2;
        });

      var promises = [
        adminOrgUsagePromise,
        atlasPMRonM2Promise,
        hI1484Promise,
      ];

      if (SetupWizardService.hasPendingServiceOrder()) {
        var tabsBasedOnPendingLicensesPromise = SetupWizardService.getPendingLicenses().then(function () {
          shouldShowMeetingsTab = SetupWizardService.hasPendingWebExMeetingLicenses();
          hasPendingCallLicenses = SetupWizardService.hasPendingCallLicenses();
          hasPendingLicenses = SetupWizardService.hasPendingLicenses();
        });
        promises.push(tabsBasedOnPendingLicensesPromise);
      }

      return $q.all(promises);
    }

    function init() {
      var tabs = getInitTabs();

      initPlanReviewTab(tabs);
      initEnterpriseSettingsTab(tabs);
      initMeetingSettingsTab(tabs);
      initCallSettingsTab(tabs);
      initCareTab(tabs);
      initAtlasPMRonM2(tabs);
      initFinishTab(tabs);
      removeTabsWithEmptySteps(tabs);
      $scope.tabs = filterTabsByStateParams(tabs);
    }

    function getInitTabs() {
      return [{
        name: 'enterpriseSettings',
        label: 'firstTimeWizard.enterpriseSettings',
        description: 'firstTimeWizard.enterpriseSettingsSub',
        icon: 'icon-settings',
        title: 'firstTimeWizard.enterpriseSettings',
        controller: 'EnterpriseSettingsCtrl as entprCtrl',
        steps: [{
          name: 'enterpriseSipUrl',
          template: 'modules/core/setupWizard/enterpriseSettings/enterprise.setSipDomain.tpl.html',
        }, {
          name: 'init',
          template: 'modules/core/setupWizard/enterpriseSettings/enterprise.init.tpl.html',
        }, {
          name: 'exportMetadata',
          template: 'modules/core/setupWizard/enterpriseSettings/enterprise.exportMetadata.tpl.html',
        }, {
          name: 'importIdp',
          template: 'modules/core/setupWizard/enterpriseSettings/enterprise.importIdp.tpl.html',
        }, {
          name: 'testSSO',
          template: 'modules/core/setupWizard/enterpriseSettings/enterprise.testSSO.tpl.html',
        }],
      },
      ];
    }

    function initPlanReviewTab(tabs) {
      var tab = {
        name: 'planReview',
        label: 'firstTimeWizard.planReview',
        description: 'firstTimeWizard.planReviewSub',
        icon: 'icon-plan-review',
        title: 'firstTimeWizard.planReview',
        controller: 'PlanReviewCtrl as planReview',
        steps: [{
          name: 'init',
          template: 'modules/core/setupWizard/planReview/planReview.tpl.html',
        }],
      };

      if (SetupWizardService.hasPendingServiceOrder()) {
        tab.label = 'firstTimeWizard.subscriptionReview';
        tab.title = 'firstTimeWizard.subscriptionReview';
      }

      tabs.splice(0, 0, tab);
    }

    function initMeetingSettingsTab(tabs) {
      var meetingTab = {
        name: 'meetingSettings',
        required: true,
        label: 'firstTimeWizard.meetingSettings',
        description: 'firstTimeWizard.setupMeetingService',
        icon: 'icon-conference',
        title: 'firstTimeWizard.setupWebexMeetingSites',
        controller: 'MeetingSettingsCtrl as meetingCtrl',
        controllerAs: 'meetingCtrl',
        steps: [{
          name: 'migrateTrial',
          template: 'modules/core/setupWizard/meeting-settings/meeting-migrate-trial.html',
        },
        {
          name: 'siteSetup',
          template: 'modules/core/setupWizard/meeting-settings/meeting-site-setup.html',
        },
        {
          name: 'licenseDistribution',
          template: 'modules/core/setupWizard/meeting-settings/meeting-license-distribution.html',
        },
        {
          name: 'summary',
          template: 'modules/core/setupWizard/meeting-settings/meeting-summary.html',
        }],
      };

      if (shouldShowMeetingsTab) {
        if (!hasWebexMeetingTrial()) {
          _.remove(meetingTab.steps, { name: 'migrateTrial' });
        }

        tabs.splice(1, 0, meetingTab);
      }
    }

    function initEnterpriseSettingsTab(tabs) {
      if (shouldRemoveSSOSteps) {
        var enterpriseSettingTab = _.find(tabs, {
          name: 'enterpriseSettings',
        }, {});
        var ssoInitIndex = _.findIndex(enterpriseSettingTab.steps, {
          name: 'init',
        });
        if (ssoInitIndex > -1) {
          enterpriseSettingTab.steps.splice(ssoInitIndex);
        }
        if (isSharedDevicesOnlyLicense) {
          enterpriseSettingTab.steps = _.filter(enterpriseSettingTab.steps, function (step) {
            return step.name !== 'exportMetadata' || step.name !== 'importIdp' || step.name !== 'testSSO';
          });
        }
      }
    }

    function initCallSettingsTab(tabs) {
      var pickCountry = {
        name: 'callPickCountry',
        template: 'modules/core/setupWizard/callSettings/serviceHuronCustomerCreate.html',
      };

      var pickLocationType = {
        name: 'pickCallLocationType',
        template: 'modules/core/setupWizard/callSettings/serviceSetupInit.html',
      };

      var setupLocation = {
        name: 'setupCallLocation',
        template: 'modules/core/setupWizard/callSettings/locationSetup.html',
      };

      var setupSite = {
        name: 'setupCallSite',
        template: 'modules/core/setupWizard/callSettings/serviceSetup.html',
      };

      if (showCallSettings()) {
        $q.resolve($scope.isCustomerPresent).then(function (customer) {
          if (customer && hasPendingCallLicenses) {
            SetupWizardService.activateAndCheckCapacity().catch(function (error) {
              $timeout(function () {
                //   $scope.$emit('wizardNextButtonDisable', true);
              });
              if (error.errorCode === 42003) {
                //Error code from Drachma
                Notification.errorWithTrackingId(error, 'firstTimeWizard.error.overCapacity');
              } else {
                Notification.errorWithTrackingId(error, 'firstTimeWizard.error.capacityFail');
              }
              $scope.$emit('wizardNextButtonDisable', true);
            });
          }

          var steps = [];

          if (!customer && hasPendingCallLicenses) {
            steps.push(pickCountry);
          }

          if (supportsHI1484) {
            steps.push(pickLocationType);
            steps.push(setupLocation);
          } else {
            steps.push(setupSite);
          }

          tabs.splice(1, 0, {
            name: 'serviceSetup',
            required: true,
            label: 'firstTimeWizard.callSettings',
            description: 'firstTimeWizard.serviceSetupSub',
            icon: 'icon-calls',
            title: 'firstTimeWizard.unifiedCommunication',
            controllerAs: '$ctrl',
            steps: steps,
          });
        });
      }
    }

    function hasWebexMeetingTrial() {
      var conferencingServices = _.filter(Authinfo.getConferenceServices(), { license: { isTrial: true } });

      return _.some(conferencingServices, function (service) {
        return _.get(service, 'license.offerName') === Config.offerCodes.MC || _.get(service, 'license.offerName') === Config.offerCodes.EE;
      });
    }

    function showCallSettings() {
      if (hasPendingCallLicenses) {
        return true;
      }

      return _.some(Authinfo.getLicenses(), function (license) {
        return license.licenseType === Config.licenseTypes.COMMUNICATION || license.licenseType === Config.licenseTypes.SHARED_DEVICES;
      });
    }

    function initCareTab(tabs) {
      if (Authinfo.isCare()) {
        var careTab = {
          name: 'careSettings',
          label: 'firstTimeWizard.careSettings',
          description: 'firstTimeWizard.careSettingsSub',
          icon: 'icon-headset',
          title: 'firstTimeWizard.careSettings',
          controller: 'CareSettingsCtrl as careSettings',
          steps: [{
            name: 'csonboard',
            template: 'modules/core/setupWizard/careSettings/careSettings.tpl.html',
          }],
        };

        var finishTabIndex = _.findIndex(tabs, function (tab) {
          return (tab.name === 'finish');
        });

        if (finishTabIndex === -1) { // finish tab not found
          tabs.push(careTab);
        } else {
          tabs.splice(finishTabIndex, 0, careTab);
        }
      }
    }

    function initAtlasPMRonM2(tabs) {
      if (supportsAtlasPMRonM2) {
        var step = {
          name: 'enterprisePmrSetup',
          template: 'modules/core/setupWizard/enterpriseSettings/enterprise.pmrSetup.tpl.html',
        };
        var enterpriseSettings = _.find(tabs, {
          name: 'enterpriseSettings',
        });
        if (enterpriseSettings) {
          enterpriseSettings.steps.splice(1, 0, step);
        }
      }
    }

    function initFinishTab(tabs) {
      if (!Authinfo.isSetupDone()) {
        var tab = {
          name: 'finish',
          label: 'firstTimeWizard.activateAndBeginBilling',
          description: 'firstTimeWizard.finishSub',
          icon: 'icon-check',
          title: 'firstTimeWizard.getStarted',
          controller: 'WizardFinishCtrl',
          steps: [{
            name: 'activate',
            template: 'modules/core/setupWizard/finish/activate.html',
          }, {
            name: 'done',
            template: 'modules/core/setupWizard/finish/finish.html',
          }],
        };

        if (!hasPendingLicenses) {
          tab.label = 'firstTimeWizard.finish';
          _.remove(tab.steps, { name: 'activate' });
        }

        tabs.push(tab);
      }
    }

    function removeTabsWithEmptySteps(tabs) {
      _.remove(tabs, function (tab) {
        return _.isArray(tab.steps) && tab.steps.length === 0;
      });
    }

    function filterTabsByStateParams(tabs) {
      if (!($stateParams.onlyShowSingleTab && $stateParams.currentTab)) {
        return tabs;
      }

      var filteredTabs = _.filter(tabs, function (tab) {
        return ($stateParams.currentTab === tab.name);
      });

      if ($stateParams.currentStep && filteredTabs.length === 1 && filteredTabs[0].steps) {
        //prevent "back" button if a step is defined in single tab mode:
        var tab = filteredTabs[0];
        var index = _.findIndex(tab.steps, {
          name: $stateParams.currentStep,
        });
        if (index > 0) {
          tab.steps.splice(0, index);
          // currentStep is now 0 index
          index = 0;
        }
        if ($stateParams.numberOfSteps) {
          // if specific number of steps, make sure no steps following
          tab.steps = _.slice(tab.steps, index, index + $stateParams.numberOfSteps);
        }
      }
      return filteredTabs;
    }
  }
})();
