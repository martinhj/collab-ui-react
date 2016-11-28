'use strict';

describe('Controller: DevicesCtrl', function () {
  var $scope, $state, $controller, controller, $httpBackend, $timeout, $q;
  var CsdmConfigService, AccountOrgService, Authinfo, FeatureToggleService;

  beforeEach(angular.mock.module('Squared'));
  beforeEach(angular.mock.module('Huron'));
  beforeEach(angular.mock.module('Core'));
  beforeEach(angular.mock.module('Sunlight'));

  beforeEach(inject(dependencies));
  beforeEach(initSpies);
  beforeEach(initController);

  function dependencies($rootScope, _$state_, _$timeout_, _$controller_, _$httpBackend_, _$q_, _CsdmConfigService_, _AccountOrgService_, _Authinfo_, _FeatureToggleService_) {
    $scope = $rootScope.$new();
    $state = _$state_;
    $controller = _$controller_;
    $httpBackend = _$httpBackend_;
    $timeout = _$timeout_;
    $q = _$q_;
    CsdmConfigService = _CsdmConfigService_;
    AccountOrgService = _AccountOrgService_;
    Authinfo = _Authinfo_;
    FeatureToggleService = _FeatureToggleService_;
  }

  function initSpies() {
    // TODO - eww this is wrong - Just make this init right now
    $httpBackend.whenGET('https://csdm-integration.wbx2.com/csdm/api/v1/organization/null/devices/?type=huron').respond([]);
    $httpBackend.whenGET(CsdmConfigService.getUrl() + '/organization/null/nonExistingDevices').respond(200);
    $httpBackend.whenGET(CsdmConfigService.getUrl() + '/organization/null/devices?checkDisplayName=false&checkOnline=false').respond(200);
    $httpBackend.whenGET(CsdmConfigService.getUrl() + '/organization/null/devices').respond(200);
    $httpBackend.expectGET(CsdmConfigService.getUrl() + '/organization/null/devices?checkDisplayName=false&checkOnline=false');
    $httpBackend.whenGET(CsdmConfigService.getUrl() + '/organization/null/codes').respond(200);
    //$httpBackend.expectGET(CsdmConfigService.getUrl() + '/organization/null/devices').respond(200);
    $httpBackend.whenGET('https://identity.webex.com/identity/scim/null/v1/Users/me').respond(200);

    spyOn(AccountOrgService, 'getAccount').and.returnValue({
      success: _.noop
    });
  }

  function initController() {
    controller = $controller('DevicesCtrl', {
      $scope: $scope,
      $state: $state
    });
    $scope.$apply();
  }

  it('should init controller', function () {
    expect(controller).toBeDefined();
    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingRequest();
    $httpBackend.verifyNoOutstandingExpectation();
  });

  it('polls for devices every 30 second', function () {
    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingRequest();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.expectGET(CsdmConfigService.getUrl() + '/organization/null/devices');
    $timeout.flush(30500);
    //$timeout.verifyNoPendingTasks();
    //$scope.$digest();
    $httpBackend.flush();
    $httpBackend.verifyNoOutstandingRequest();
    $httpBackend.verifyNoOutstandingExpectation();
  });

  describe('startAddDeviceFlow function', function () {
    var displayName;
    var userCisUuid;
    var firstName;
    var email;
    var orgId;
    var isEntitledToHuron;
    var isEntitledToRoomSystem;
    var showDarling;
    var showATA;
    beforeEach(function () {
      isEntitledToHuron = true;
      isEntitledToRoomSystem = true;
      showDarling = true;
      showATA = true;
      displayName = 'displayName';
      firstName = 'firstName';
      userCisUuid = 'userCisUuid';
      email = 'email@address.com';
      orgId = 'orgId';
      spyOn(controller, 'isEntitledToHuron').and.returnValue(isEntitledToHuron);
      spyOn(Authinfo, 'isDeviceMgmt').and.returnValue(isEntitledToRoomSystem);
      spyOn(Authinfo, 'getUserId').and.returnValue(userCisUuid);
      spyOn(Authinfo, 'getPrimaryEmail').and.returnValue(email);
      spyOn(Authinfo, 'getOrgId').and.returnValue(orgId);
      spyOn($state, 'go');
      controller.adminDisplayName = displayName;
      controller.adminFirstName = firstName;
      controller.showDarling = showDarling;
    });

    it('should set the wizardState with correct fields for the wizard if places toggle is on', function () {
      controller.showATA = showATA;
      controller.startAddDeviceFlow();
      $scope.$apply();
      expect($state.go).toHaveBeenCalled();
      var wizardState = $state.go.calls.mostRecent().args[1].wizard.state().data;
      expect(wizardState.title).toBe('addDeviceWizard.newDevice');
      expect(wizardState.function).toBe('addDevice');
      expect(wizardState.showDarling).toBe(showDarling);
      expect(wizardState.showATA).toBe(showATA);
      expect(wizardState.isEntitledToHuron).toBe(isEntitledToHuron);
      expect(wizardState.isEntitledToRoomSystem).toBe(isEntitledToRoomSystem);
      expect(wizardState.account).toBeUndefined();
      expect(wizardState.recipient.displayName).toBe(displayName);
      expect(wizardState.recipient.firstName).toBe(firstName);
      expect(wizardState.recipient.cisUuid).toBe(userCisUuid);
      expect(wizardState.recipient.email).toBe(email);
      expect(wizardState.recipient.organizationId).toBe(orgId);
    });

    it('should set the wizardState with correct fields for the wizard if places toggle is off', function () {
      controller.showATA = showATA;
      controller.startAddDeviceFlow();
      $scope.$apply();
      expect($state.go).toHaveBeenCalled();
      var wizardState = $state.go.calls.mostRecent().args[1].wizard.state().data;
      expect(wizardState.title).toBe('addDeviceWizard.newDevice');
      expect(wizardState.function).toBe('addDevice');
      expect(wizardState.showDarling).toBe(showDarling);
      expect(wizardState.showATA).toBe(showATA);
      expect(wizardState.isEntitledToHuron).toBe(isEntitledToHuron);
      expect(wizardState.isEntitledToRoomSystem).toBe(isEntitledToRoomSystem);
      expect(wizardState.account).toBeUndefined();
      expect(wizardState.recipient.displayName).toBe(displayName);
      expect(wizardState.recipient.firstName).toBe(firstName);
      expect(wizardState.recipient.cisUuid).toBe(userCisUuid);
      expect(wizardState.recipient.email).toBe(email);
      expect(wizardState.recipient.organizationId).toBe(orgId);
    });
  });

  describe('Feature toggle loading', function () {
    beforeEach(function () {
      spyOn(FeatureToggleService, 'atlasDarlingGetStatus').and.returnValue($q.when(true));
      spyOn(FeatureToggleService, 'csdmATAGetStatus').and.returnValue($q.when(true));
      spyOn(FeatureToggleService, 'csdmPstnGetStatus').and.returnValue($q.when(true));
    });

    it('should resolve toggle loading', function () {
      spyOn(FeatureToggleService, 'csdmHybridCallGetStatus').and.returnValue($q.when(true));
      controller = $controller('DevicesCtrl', {
        $scope: $scope,
        $state: $state,
        FeatureToggleService: FeatureToggleService
      });
      expect(controller.addDeviceIsDisabled).toBeTruthy();
      $scope.$digest();
      expect(controller.addDeviceIsDisabled).toBeFalsy();
    });

    it('should resolve toggle loading if a promise fails', function () {
      var deferred = $q.defer();
      spyOn(FeatureToggleService, 'csdmHybridCallGetStatus').and.returnValue(deferred.promise);
      controller = $controller('DevicesCtrl', {
        $scope: $scope,
        $state: $state
      });
      expect(controller.addDeviceIsDisabled).toBeTruthy();
      deferred.reject();
      $scope.$digest();
      expect(controller.addDeviceIsDisabled).toBeFalsy();
    });
  });
});
