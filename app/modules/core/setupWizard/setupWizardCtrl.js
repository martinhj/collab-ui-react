require('./_setup-wizard.scss');

(function () {
  'use strict';

  // TODO: refactor - do not use 'ngtemplate-loader' or ng-include directive
  var planReviewInitTemplatePath = require('ngtemplate-loader?module=Core!./planReview/planReview.tpl.html');
  var planReviewSelectSubscriptionTemplatePath = require('ngtemplate-loader?module=Core!./planReview/select-subscription.html');

  var enterpriseSetSipDomainTemplatePath = require('ngtemplate-loader?module=Core!./enterpriseSettings/enterprise.setSipDomain.tpl.html');
  var enterpriseInitTemplatePath = require('ngtemplate-loader?module=Core!./enterpriseSettings/enterprise.init.tpl.html');
  var enterpriseExportMetadataTemplatePath = require('ngtemplate-loader?module=Core!./enterpriseSettings/enterprise.exportMetadata.tpl.html');
  var enterpriseImportIdpTemplatePath = require('ngtemplate-loader?module=Core!./enterpriseSettings/enterprise.importIdp.tpl.html');
  var enterpriseTestSSOTemplatePath = require('ngtemplate-loader?module=Core!./enterpriseSettings/enterprise.testSSO.tpl.html');
  var enterprisePmrSetupTemplatePath = require('ngtemplate-loader?module=Core!./enterpriseSettings/enterprise.pmrSetup.tpl.html');

  var meetingSettingsMigrateTrialTemplatePath = require('ngtemplate-loader?module=Core!./meeting-settings/meeting-migrate-trial.html');
  var meetingSettingsSiteSetupTemplatePath = require('ngtemplate-loader?module=Core!./meeting-settings/meeting-site-setup.html');
  var meetingSettingsLicenseDistributionTemplatePath = require('ngtemplate-loader?module=Core!./meeting-settings/meeting-license-distribution.html');
  var meetingSettingsSetPartnerAudioTemplatePath = require('ngtemplate-loader?module=Core!./meeting-settings/meeting-audio-partner.html');
  var meetingSettingsSetCCASPTemplatePath = require('ngtemplate-loader?module=Core!./meeting-settings/meeting-ccasp.html');
  var meetingSettingsSummaryTemplatePath = require('ngtemplate-loader?module=Core!./meeting-settings/meeting-summary.html');

  var callSettingsCallPickupCountryTemplatePath = require('ngtemplate-loader?module=Core!./callSettings/serviceHuronCustomerCreate.html');
  var callSettingsPickLocationTypeTemplatePath = require('ngtemplate-loader?module=Core!./callSettings/serviceSetupInit.html');
  var callSettingsSetupLocationTemplatePath = require('ngtemplate-loader?module=Core!./callSettings/locationSetup.html');
  var callSettingsSetupSiteTemplatePath = require('ngtemplate-loader?module=Core!./callSettings/serviceSetup.html');

  var careSettingsTemplatePath = require('ngtemplate-loader?module=Core!./careSettings/careSettings.tpl.html');

  var finishProvisionTemplatePath = require('ngtemplate-loader?module=Core!./finish/provision.html');
  var finishDoneTemplatePath = require('ngtemplate-loader?module=Core!./finish/finish.html');

  angular.module('Core')
    .controller('SetupWizardCtrl', SetupWizardCtrl);

  function SetupWizardCtrl($q, $scope, $state, $stateParams, $timeout, Authinfo, Config, FeatureToggleService, Orgservice, SessionStorage, SetupWizardService, StorageKeys, Notification) {
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

    // If a partner cross-launches into a customer through the Order Processing flow
    // with a subscriptionId of an active subscription, we navigate the user to overview
    if (isFirstTimeSetup && SetupWizardService.isProvisionedSubscription(SessionStorage.get(StorageKeys.SUBSCRIPTION_ID))) {
      Authinfo.setSetupDone(true);
      return $state.go('overview');
    }

    if (Authinfo.isCustomerAdmin()) {
      SetupWizardService.onActingSubscriptionChange(init);
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
          var licenses = _.flatMap(subscriptions, 'licenses');
          var uniqueLicenseTypes = _.uniq(_.map(licenses, 'licenseType'));
          isSharedDevicesOnlyLicense = _.without(uniqueLicenseTypes, Config.licenseTypes.SHARED_DEVICES).length === 0;
        })
        .catch(_.noop);

      var atlasPMRonM2Promise = FeatureToggleService.supports(FeatureToggleService.features.atlasPMRonM2)
        .then(function (_supportsAtlasPMRonM2) {
          supportsAtlasPMRonM2 = _supportsAtlasPMRonM2;
        });

      var pendingSubscriptionsPromise = SetupWizardService.populatePendingSubscriptions();

      var promises = [
        adminOrgUsagePromise,
        atlasPMRonM2Promise,
        hI1484Promise,
        pendingSubscriptionsPromise,
      ];
      return $q.all(promises);
    }

    function init() {
      getPendingSubscriptionFlags();
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

    function getPendingSubscriptionFlags() {
      shouldShowMeetingsTab = SetupWizardService.hasPendingWebExMeetingLicenses();
      hasPendingCallLicenses = SetupWizardService.hasPendingCallLicenses();
      hasPendingLicenses = SetupWizardService.hasPendingLicenses();
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
          template: enterpriseSetSipDomainTemplatePath,
        }, {
          name: 'init',
          template: enterpriseInitTemplatePath,
        }, {
          name: 'exportMetadata',
          template: enterpriseExportMetadataTemplatePath,
        }, {
          name: 'importIdp',
          template: enterpriseImportIdpTemplatePath,
        }, {
          name: 'testSSO',
          template: enterpriseTestSSOTemplatePath,
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
          template: planReviewInitTemplatePath,
        }],
      };

      if (SetupWizardService.hasPendingSubscriptionOptions()) {
        var step = {
          name: 'select-subscription',
          template: planReviewSelectSubscriptionTemplatePath,
          title: 'firstTimeWizard.selectSubscriptionTitle',
        };
        tab.steps.splice(0, 0, step);
      }

      if (SetupWizardService.hasPendingServiceOrder() || SetupWizardService.hasPendingSubscriptionOptions()) {
        tab.label = 'firstTimeWizard.subscriptionReview';
        tab.title = 'firstTimeWizard.subscriptionReview';
        tab.subtitle = 'firstTimeWizard.servicesInSubscription';
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
          template: meetingSettingsMigrateTrialTemplatePath,
        },
        {
          name: 'siteSetup',
          template: meetingSettingsSiteSetupTemplatePath,
        },
        {
          name: 'licenseDistribution',
          template: meetingSettingsLicenseDistributionTemplatePath,
        },
        {
          name: 'setPartnerAudio',
          template: meetingSettingsSetPartnerAudioTemplatePath,
        },
        {
          name: 'setCCASP',
          template: meetingSettingsSetCCASPTemplatePath,
        },
        {
          name: 'summary',
          template: meetingSettingsSummaryTemplatePath,
        }],
      };

      if (shouldShowMeetingsTab) {
        if (!SetupWizardService.hasPendingTSPAudioPackage() || SetupWizardService.getActiveTSPAudioPackage() !== undefined) {
          _.remove(meetingTab.steps, { name: 'setPartnerAudio' });
        }
        if (!SetupWizardService.hasPendingCCASPPackage() || SetupWizardService.getActiveCCASPPackage() !== undefined) {
          _.remove(meetingTab.steps, { name: 'setCCASP' });
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
        template: callSettingsCallPickupCountryTemplatePath,
      };

      var pickLocationType = {
        name: 'pickCallLocationType',
        template: callSettingsPickLocationTypeTemplatePath,
      };

      var setupLocation = {
        name: 'setupCallLocation',
        template: callSettingsSetupLocationTemplatePath,
      };

      var setupSite = {
        name: 'setupCallSite',
        template: callSettingsSetupSiteTemplatePath,
      };

      if (showCallSettings()) {
        $q.resolve($scope.isCustomerPresent).then(function (customer) {
          if (customer && hasPendingCallLicenses) {
            SetupWizardService.activateAndCheckCapacity().catch(function (error) {
              $timeout(function () {
                //   $scope.$emit('wizardNextButtonDisable', true);
              });
              if (error.status === 412) {
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

    function showCallSettings() {
      if (hasPendingCallLicenses) {
        return true;
      }

      var currentSubscription = SetupWizardService.getActingPendingSubscriptionOptionSelection();

      return _.some(Authinfo.getLicenses(), function (license) {
        return (license.licenseType === Config.licenseTypes.COMMUNICATION || license.licenseType === Config.licenseTypes.SHARED_DEVICES)
          && (_.isUndefined(currentSubscription) || license.billingServiceId === currentSubscription.value);
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
            template: careSettingsTemplatePath,
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
          template: enterprisePmrSetupTemplatePath,
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
          label: 'firstTimeWizard.provisionAndBeginBilling',
          description: 'firstTimeWizard.finishSub',
          icon: 'icon-check',
          title: 'firstTimeWizard.provisionAndBeginBilling',
          controller: 'WizardFinishCtrl',
          steps: [{
            name: 'provision',
            template: finishProvisionTemplatePath,
          }, {
            name: 'done',
            template: finishDoneTemplatePath,
          }],
        };

        if (!hasPendingLicenses) {
          tab.label = 'firstTimeWizard.finish';
          tab.title = 'firstTimeWizard.getStarted';
          _.remove(tab.steps, { name: 'provision' });
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

      // Show Subscription selection step if user is setting up WebEx meetings
      if ($stateParams.currentTab === 'meetingSettings') {
        var planReviewTab = _.find(tabs, { name: 'planReview' });
        filteredTabs.unshift(planReviewTab);
      }

      return filteredTabs;
    }
  }
})();
