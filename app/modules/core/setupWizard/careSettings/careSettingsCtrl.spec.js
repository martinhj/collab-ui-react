'use strict';

describe('CareSettingsCtrl', function () {
  function initDependencies() {
    this.injectDependencies('$controller', '$httpBackend', '$interval', '$q', '$scope', 'Authinfo', 'Notification', 'SunlightConfigService', 'UrlConfig', 'URService');
    this.$scope.wizard = {};
    this.$scope.wizard.isNextDisabled = false;
    this.orgId = 'deba1221-ab12-cd34-de56-abcdef123456';
    this.urServiceUrlRegEx = /qnr\/v1\/organization\/.*\/queue\/.*/;
    this.constants = {
      ONBOARDED: 'onboarded',
      NOT_ONBOARDED: 'notOnboarded',
      IN_PROGRESS: 'inProgress',
    };
    this.constants.status = {
      UNKNOWN: 'Unknown',
      PENDING: 'Pending',
      SUCCESS: 'Success',
      FAILURE: 'Failure',
    };
  }

  function initSpies(userOrgId, isCareVoice) {
    spyOn(this.SunlightConfigService, 'updateChatConfig').and.returnValue(this.$q.resolve('fake updateChatConfig response'));
    spyOn(this.SunlightConfigService, 'onBoardCare').and.returnValue(this.$q.resolve('fake onBoardCare response'));
    spyOn(this.SunlightConfigService, 'onboardCareBot').and.returnValue(this.$q.resolve('fake onboardCareBot response'));
    spyOn(this.Authinfo, 'getOrgId').and.returnValue('deba1221-ab12-cd34-de56-abcdef123456');
    spyOn(this.Authinfo, 'getUserOrgId').and.returnValue(userOrgId);
    spyOn(this.Authinfo, 'getOrgName').and.returnValue('SunlightConfigService test org');
    spyOn(this.Authinfo, 'isCareVoice').and.returnValue(isCareVoice);
    spyOn(this, '$interval').and.callThrough();

    this.sunlightChatConfigUrl = this.UrlConfig.getSunlightConfigServiceUrl() + '/organization/' + this.Authinfo.getOrgId() + '/chat';
  }

  function initController(_controllerLocals) {
    var controllerLocals = _.assignIn({}, {
      $scope: this.$scope,
      $interval: this.$interval,
      Notification: this.Notification,
    }, _controllerLocals);

    this.initController('CareSettingsCtrl', { controllerLocals: controllerLocals });
  }

  afterEach(function () {
    this.$httpBackend.verifyNoOutstandingExpectation();
    this.$httpBackend.verifyNoOutstandingRequest();
  });

  describe('Partner managing other orgs: Controller: Care Settings', function () {
    beforeEach(function () {
      this.initModules(
        'Sunlight'
      );
    });
    beforeEach(initDependencies);
    beforeEach(function () {
      initSpies.call(this, 'aeba1221-ab12-cd34-de56-abcdef123456', false);
    });

    describe('CareSettings - Init', function () {
      it('should show enabled setup care button and disabled next button, if Org is not onboarded already.', function () {
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(404, {});
        spyOn(this.URService, 'getQueue').and.returnValue(this.$q.resolve('fake getQueue response'));
        initController.call(this);
        expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('should show enabled setup care button and disabled next button, if onboarded status is UNKNOWN', function () {
        var chatConfigResponse = {
          csOnboardingStatus: this.constants.status.UNKNOWN,
          aaOnboardingStatus: this.constants.status.SUCCESS,
        };
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(200, chatConfigResponse);
        spyOn(this.URService, 'getQueue').and.returnValue(this.$q.resolve('fake getQueue response'));
        initController.call(this);
        expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('should show enabled setup care button and disabled next button, if default sunlight queue is not created', function () {
        this.$httpBackend.expectGET(this.urServiceUrlRegEx).respond(404);
        initController.call(this);
        expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('should allow proceeding with next steps, if queue is created, cs and aa are already onboarded', function () {
        var getQueueResponse = {
          defaultQueueStatus: this.constants.status.SUCCESS,
        };
        this.$httpBackend.expectGET(this.urServiceUrlRegEx).respond(200, getQueueResponse);
        var chatConfigResponse = {
          csOnboardingStatus: this.constants.status.SUCCESS,
          aaOnboardingStatus: this.constants.status.SUCCESS,
          appOnboardStatus: this.constants.status.UNKNOWN,
        };
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(200, chatConfigResponse);
        initController.call(this);
        expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.ONBOARDED);
        expect(this.$scope.wizard.isNextDisabled).toBe(false);
      });

      it('should show loading and disabled next button, if csOnboardingStatus is Pending ', function () {
        var getQueueResponse = {
          defaultQueueStatus: this.constants.status.SUCCESS,
        };
        this.$httpBackend.expectGET(this.urServiceUrlRegEx).respond(200, getQueueResponse);
        var chatConfigResponse = {
          csOnboardingStatus: this.constants.status.PENDING,
          aaOnboardingStatus: this.constants.status.SUCCESS,
        };
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(200, chatConfigResponse);
        initController.call(this);
        expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.IN_PROGRESS);
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('should show loading and enable next button, if aaOnboardStatus is Pending because isCareVoice is false ', function () {
        var getQueueResponse = {
          defaultQueueStatus: this.constants.status.SUCCESS,
        };
        this.$httpBackend.expectGET(this.urServiceUrlRegEx).respond(200, getQueueResponse);
        var chatConfigResponse = {
          csOnboardingStatus: this.constants.status.SUCCESS,
          aaOnboardingStatus: this.constants.status.PENDING,
        };
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(200, chatConfigResponse);
        initController.call(this);
        expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.ONBOARDED);
        expect(this.$scope.wizard.isNextDisabled).toBe(false);
      });
    });

    describe('CareSettings - Setup Care - Success', function () {
      it('should call the onboard config api and flash setup care button', function () {
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(404, {});
        initController.call(this);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
        this.controller.onboardToCare();
        this.$scope.$apply();
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(200, { csOnboardingStatus: 'Pending' });
        this.$interval.flush(10002);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.IN_PROGRESS);
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('should allow proceeding with next steps, after onboard config api completes', function () {
        spyOn(this.Notification, 'success').and.returnValue(true);
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(404, {});
        initController.call(this);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
        this.controller.onboardToCare();
        this.$scope.$apply();
        var chatConfigResponse = {
          csOnboardingStatus: this.constants.status.SUCCESS,
          aaOnboardStatus: this.constants.status.SUCCESS,
        };
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(200, chatConfigResponse);
        this.$interval.flush(10002);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.ONBOARDED);
        expect(this.Notification.success).toHaveBeenCalled();
        expect(this.$scope.wizard.isNextDisabled).toBe(false);
      });
    });

    describe('CareSettings - Setup Care - Failure', function () {
      it('should show error toaster if timed out', function () {
        spyOn(this.Notification, 'error').and.returnValue(true);
        this.$httpBackend.whenGET(this.urServiceUrlRegEx).respond(200);
        this.$httpBackend.whenGET(this.sunlightChatConfigUrl).respond(404, {});
        initController.call(this);
        this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
        this.controller.onboardToCare();
        this.$scope.$apply();
        for (var i = 30; i >= 0; i--) {
          this.$httpBackend.whenGET(this.sunlightChatConfigUrl).respond(404, {});
          this.$interval.flush(10001);
        }
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        expect(this.Notification.error).toHaveBeenCalled();
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('should show error toaster if backend API fails', function () {
        spyOn(this.Notification, 'errorWithTrackingId').and.returnValue(true);
        this.$httpBackend.whenGET(this.urServiceUrlRegEx).respond(500);
        this.$httpBackend.whenGET(this.sunlightChatConfigUrl).respond(500, {});
        initController.call(this);
        this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
        this.controller.onboardToCare();
        this.$scope.$apply();
        this.$httpBackend.flush();
        for (var i = 3; i >= 0; i--) {
          this.$httpBackend.whenGET(this.sunlightChatConfigUrl).respond(500, {});
          this.$interval.flush(10001);
        }
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
        expect(this.Notification.errorWithTrackingId).toHaveBeenCalled();
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('should allow proceeding with next steps, if failed to get status on loading', function () {
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(403, {});
        initController.call(this);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('should show error toaster if onboardStatus is failure', function () {
        spyOn(this.Notification, 'errorWithTrackingId').and.returnValue(true);
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(404, {});
        initController.call(this);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
        this.controller.onboardToCare();
        this.$scope.$apply();
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(200, { csOnboardingStatus: 'Failure' });
        this.$interval.flush(10001);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        expect(this.Notification.errorWithTrackingId).toHaveBeenCalled();
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });
    });
  });

  describe('Partner managing other orgs: Care Settings - when org has K2 entitlement', function () {
    beforeEach(function () {
      this.initModules(
        'Sunlight'
      );
    });
    beforeEach(initDependencies);
    beforeEach(function () {
      initSpies.call(this, 'aeba1221-ab12-cd34-de56-abcdef123456', true);
    });

    it('should show enabled setup care button and disabled next button, if Org is not onboarded already.', function () {
      this.$httpBackend.expectGET(this.urServiceUrlRegEx)
        .respond(200);
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl)
        .respond(200, {
          csOnboardingStatus: this.constants.status.UNKNOWN,
          aaOnboardingStatus: this.constants.status.UNKNOWN,
        });
      initController.call(this);
      expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
      expect(this.$scope.wizard.isNextDisabled).toBe(true);
    });

    it('should allow proceeding with next steps, if cs and aa are already onboarded', function () {
      this.$httpBackend.expectGET(this.urServiceUrlRegEx)
        .respond(200);
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl)
        .respond(200, {
          csOnboardingStatus: this.constants.status.SUCCESS,
          appOnboardStatus: this.constants.status.UNKNOWN,
          aaOnboardingStatus: this.constants.status.SUCCESS,
        });
      initController.call(this);
      expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.ONBOARDED);
      expect(this.$scope.wizard.isNextDisabled).toBe(false);
    });

    it('should show loading and disabled next button, if aaOnboardingStatus is Pending ', function () {
      this.$httpBackend.expectGET(this.urServiceUrlRegEx)
        .respond(200);
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl)
        .respond(200, {
          csOnboardingStatus: this.constants.status.SUCCESS,
          appOnboardStatus: this.constants.status.SUCCESS,
          aaOnboardingStatus: this.constants.status.PENDING,
        });
      initController.call(this);
      expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.IN_PROGRESS);
      expect(this.$scope.wizard.isNextDisabled).toBe(true);
    });

    it('should show loading animation on setup care button, if Org csOnboardingStatus is in progress', function () {
      this.$httpBackend.expectGET(this.urServiceUrlRegEx)
        .respond(200);
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl)
        .respond(200, {
          csOnboardingStatus: this.constants.status.PENDING,
          appOnboardStatus: this.constants.status.SUCCESS,
          aaOnboardingStatus: this.constants.status.PENDING,
        });
      initController.call(this);
      expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.IN_PROGRESS);
    });

    it('should show loading animation on setup care button, if appOnboardStatus is pending', function () {
      this.$httpBackend.expectGET(this.urServiceUrlRegEx)
        .respond(200);
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl)
        .respond(200, {
          csOnboardingStatus: this.constants.status.SUCCESS,
          appOnboardStatus: this.constants.status.PENDING,
          aaOnboardingStatus: this.constants.status.SUCCESS,
        });
      initController.call(this);
      expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.ONBOARDED);
    });

    it('should enable setup care button, if csOnboarding or aaOnboarding is failure', function () {
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl)
        .respond(200, {
          csOnboardingStatus: this.constants.status.SUCCESS,
          appOnboardStatus: this.constants.status.UNKNOWN,
          aaOnboardingStatus: this.constants.status.FAILURE,
        });
      initController.call(this);
      expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
    });

    it('should disable setup care button, after onboarding is complete', function () {
      spyOn(this.SunlightConfigService, 'aaOnboard').and.returnValue(this.$q.resolve('fake aaOnboard response'));
      spyOn(this.Notification, 'success').and.returnValue(true);
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(404, {});
      initController.call(this);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
      this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
      this.controller.onboardToCare();
      this.$scope.$apply();
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl)
        .respond(200, {
          csOnboardingStatus: this.constants.status.SUCCESS,
          appOnboardStatus: this.constants.status.UNKNOWN,
          aaOnboardingStatus: this.constants.status.SUCCESS,
        });
      this.$interval.flush(10001);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.ONBOARDED);
      expect(this.Notification.success).toHaveBeenCalled();
    });

    it('should show error notification, if any of the onboarding promises fail', function () {
      var dummyResponse = { status: 202 };
      var promise = this.$q.resolve(dummyResponse);
      this.SunlightConfigService.onBoardCare.and.returnValue(promise);
      spyOn(this.SunlightConfigService, 'aaOnboard').and.returnValue(this.$q.reject('fake aaOnboard response'));
      spyOn(this.Notification, 'errorWithTrackingId').and.returnValue(true);
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(404, {});
      initController.call(this);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
      this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
      this.controller.onboardToCare();
      this.$scope.$apply();
      expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
      expect(this.controller.csOnboardingStatus).toBe(this.constants.status.SUCCESS);
      expect(this.Notification.errorWithTrackingId).toHaveBeenCalled();
    });
  });

  describe('Partner managing his own org: Controller: Care Settings', function () {
    beforeEach(function () {
      this.initModules(
        'Sunlight'
      );
    });
    beforeEach(initDependencies);
    beforeEach(function () {
      initSpies.call(this, 'deba1221-ab12-cd34-de56-abcdef123456', false);
    });

    describe('CareSettings - Init', function () {
      it('should show enabled setup care button and disabled next button, if Org is not onboarded already.', function () {
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(404, {});
        initController.call(this);
        expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('show enabled setup care button and disabled next button, if onboarded status is UNKNOWN', function () {
        var chatConfigResponse = {
          csOnboardingStatus: this.constants.status.UNKNOWN,
          aaOnboardingStatus: this.constants.status.SUCCESS,
        };
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(200, chatConfigResponse);
        initController.call(this);
        this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
        expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('should not allow proceeding with next steps, if cs and aa are already onboarded but apponboarding is UNKNOWN', function () {
        var chatConfigResponse = {
          csOnboardingStatus: this.constants.status.SUCCESS,
          aaOnboardingStatus: this.constants.status.SUCCESS,
          appOnboardStatus: this.constants.status.UNKNOWN,
        };
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(200, chatConfigResponse);
        initController.call(this);
        this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
        expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('should show loading and disabled next button, if csOnboardingStatus is Pending ', function () {
        var chatConfigResponse = {
          csOnboardingStatus: this.constants.status.PENDING,
          aaOnboardingStatus: this.constants.status.SUCCESS,
        };
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(200, chatConfigResponse);
        initController.call(this);
        this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
        expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.IN_PROGRESS);
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('should show loading and enable next button, if aaOnboardStatus is Pending because isCareVoice is false ', function () {
        var chatConfigResponse = {
          csOnboardingStatus: this.constants.status.SUCCESS,
          aaOnboardingStatus: this.constants.status.PENDING,
          appOnboardStatus: this.constants.status.SUCCESS,
        };
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(200, chatConfigResponse);
        initController.call(this);
        this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
        expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.ONBOARDED);
        expect(this.$scope.wizard.isNextDisabled).toBe(false);
      });
    });

    describe('CareSettings - Setup Care - Success', function () {
      it('should call the onboard config api and flash setup care button', function () {
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(404, {});
        initController.call(this);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
        this.controller.onboardToCare();
        this.$scope.$apply();
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(200, { csOnboardingStatus: 'Pending' });
        this.$interval.flush(10002);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.IN_PROGRESS);
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('should allow proceeding with next steps, after onboard config api completes', function () {
        spyOn(this.Notification, 'success').and.returnValue(true);
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(404, {});
        initController.call(this);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
        this.controller.onboardToCare();
        this.$scope.$apply();
        var chatConfigResponse = {
          csOnboardingStatus: this.constants.status.SUCCESS,
          appOnboardStatus: this.constants.status.SUCCESS,
        };
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(200, chatConfigResponse);
        this.$interval.flush(10002);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.ONBOARDED);
        expect(this.Notification.success).toHaveBeenCalled();
        expect(this.$scope.wizard.isNextDisabled).toBe(false);
      });
    });

    describe('CareSettings - Setup Care - Failure', function () {
      it('should show error toaster if timed out', function () {
        spyOn(this.Notification, 'error').and.returnValue(true);
        this.$httpBackend.whenGET(this.sunlightChatConfigUrl).respond(404, {});
        initController.call(this);
        this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
        this.controller.onboardToCare();
        this.$scope.$apply();
        for (var i = 30; i >= 0; i--) {
          this.$httpBackend.whenGET(this.sunlightChatConfigUrl).respond(404, {});
          this.$interval.flush(10001);
        }
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        expect(this.Notification.error).toHaveBeenCalled();
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('should show error toaster if backend API fails', function () {
        spyOn(this.Notification, 'errorWithTrackingId').and.returnValue(true);
        this.$httpBackend.whenGET(this.sunlightChatConfigUrl).respond(500, {});
        initController.call(this);
        this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
        this.controller.onboardToCare();
        this.$scope.$apply();
        for (var i = 3; i >= 0; i--) {
          this.$httpBackend.whenGET(this.sunlightChatConfigUrl).respond(500, {});
          this.$interval.flush(10001);
        }
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
        expect(this.Notification.errorWithTrackingId).toHaveBeenCalled();
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('should allow proceeding with next steps, if failed to get status on loading', function () {
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(403, {});
        initController.call(this);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });

      it('should show error toaster if onboardStatus is failure', function () {
        spyOn(this.Notification, 'errorWithTrackingId').and.returnValue(true);
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(404, {});
        initController.call(this);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
        this.controller.onboardToCare();
        this.$scope.$apply();
        this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(200, { csOnboardingStatus: 'Failure' });
        this.$interval.flush(10001);
        this.$httpBackend.flush();
        expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
        expect(this.Notification.errorWithTrackingId).toHaveBeenCalled();
        expect(this.$scope.wizard.isNextDisabled).toBe(true);
      });
    });
  });

  describe('Partner managing his own org: Care Settings - when org has K2 entitlement', function () {
    beforeEach(function () {
      this.initModules(
        'Sunlight'
      );
    });
    beforeEach(initDependencies);
    beforeEach(function () {
      initSpies.call(this, 'deba1221-ab12-cd34-de56-abcdef123456', true);
    });

    it('should show enabled setup care button and disabled next button, if Org is not onboarded already.', function () {
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl)
        .respond(200, {
          csOnboardingStatus: this.constants.status.UNKNOWN,
          aaOnboardingStatus: this.constants.status.UNKNOWN,
        });
      initController.call(this);
      this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
      expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.controller.NOT_ONBOARDED);
      expect(this.$scope.wizard.isNextDisabled).toBe(true);
    });

    it('should allow proceeding with next steps, if cs, app and aa are already onboarded', function () {
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl)
        .respond(200, {
          csOnboardingStatus: this.constants.status.SUCCESS,
          appOnboardStatus: this.constants.status.SUCCESS,
          aaOnboardingStatus: this.constants.status.SUCCESS,
        });
      initController.call(this);
      this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
      expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.ONBOARDED);
      expect(this.$scope.wizard.isNextDisabled).toBe(false);
    });

    it('should show loading and disabled next button, if aaOnboardingStatus is Pending ', function () {
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl)
        .respond(200, {
          csOnboardingStatus: this.constants.status.SUCCESS,
          appOnboardStatus: this.constants.status.SUCCESS,
          aaOnboardingStatus: this.constants.status.PENDING,
        });
      initController.call(this);
      this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
      expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.IN_PROGRESS);
      expect(this.$scope.wizard.isNextDisabled).toBe(true);
    });

    it('should show loading animation on setup care button, if Org csOnboardingStatus is in progress', function () {
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl)
        .respond(200, {
          csOnboardingStatus: this.constants.status.PENDING,
          appOnboardStatus: this.constants.status.SUCCESS,
          aaOnboardingStatus: this.constants.status.PENDING,
        });
      initController.call(this);
      this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
      expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.IN_PROGRESS);
    });

    it('should show loading animation on setup care button, if appOnboardStatus is pending', function () {
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl)
        .respond(200, {
          csOnboardingStatus: this.constants.status.SUCCESS,
          appOnboardStatus: this.constants.status.PENDING,
          aaOnboardingStatus: this.constants.status.SUCCESS,
        });
      initController.call(this);
      this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
      expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.IN_PROGRESS);
    });

    it('should enable setup care button, if csOnboarding or aaOnboarding is failure', function () {
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl)
        .respond(200, {
          csOnboardingStatus: this.constants.status.SUCCESS,
          appOnboardStatus: this.constants.status.UNKNOWN,
          aaOnboardingStatus: this.constants.status.FAILURE,
        });
      initController.call(this);
      this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
      expect(this.controller.state).toBe(this.constants.status.UNKNOWN);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
    });

    it('should disable setup care button, after onboarding is complete', function () {
      spyOn(this.SunlightConfigService, 'aaOnboard').and.returnValue(this.$q.resolve('fake aaOnboard response'));
      spyOn(this.Notification, 'success').and.returnValue(true);
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(404, {});
      initController.call(this);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
      this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
      this.controller.onboardToCare();
      this.$scope.$apply();
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl)
        .respond(200, {
          csOnboardingStatus: this.constants.status.SUCCESS,
          appOnboardStatus: this.constants.status.SUCCESS,
          aaOnboardingStatus: this.constants.status.SUCCESS,
        });
      this.$interval.flush(10001);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.ONBOARDED);
      expect(this.Notification.success).toHaveBeenCalled();
    });

    it('should show error notification, if any of the onboarding promises fail', function () {
      spyOn(this.SunlightConfigService, 'aaOnboard').and.returnValue(this.$q.reject('fake aaOnboard response'));
      spyOn(this.Notification, 'errorWithTrackingId').and.returnValue(true);
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(404, {});
      initController.call(this);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
      this.controller.onboardToCare();
      this.$scope.$apply();
      expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
      expect(this.Notification.errorWithTrackingId).toHaveBeenCalled();
    });
  });

  describe('Care Settings - when org is already onboarded', function () {
    beforeEach(function () {
      this.initModules(
        'Sunlight'
      );
    });
    beforeEach(initDependencies);
    beforeEach(function () {
      initSpies.call(this, 'deba1221-ab12-cd34-de56-abcdef123456', true);
    });

    it('should not show error notification and disable setup care button, if org is already onboarded', function () {
      this.SunlightConfigService.onboardCareBot = jasmine.createSpy('onboardCareBot').and.returnValue(this.$q.reject({ status: 412 }));
      spyOn(this.Notification, 'success').and.returnValue(true);
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl).respond(404, {});
      initController.call(this);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.NOT_ONBOARDED);
      this.controller.defaultQueueStatus = this.constants.status.SUCCESS;
      this.controller.onboardToCare();
      this.$scope.$apply();
      this.$httpBackend.expectGET(this.sunlightChatConfigUrl)
        .respond(200, {
          csOnboardingStatus: this.constants.status.SUCCESS,
          appOnboardStatus: this.constants.status.SUCCESS,
          aaOnboardingStatus: this.constants.status.SUCCESS,
        });
      this.$interval.flush(10001);
      this.$httpBackend.flush();
      expect(this.controller.state).toBe(this.constants.ONBOARDED);
      expect(this.Notification.success).toHaveBeenCalled();
    });
  });
});
